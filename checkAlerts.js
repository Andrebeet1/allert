// checkAlerts.js
import dotenv from "dotenv";
import pkg from "pg";
import fetch from "node-fetch";
import { Bot } from "grammy";

// Chargement des variables d'environnement
dotenv.config();

const bot = new Bot(process.env.TELEGRAM_TOKEN);
const { Pool } = pkg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// Fonction pour récupérer le prix d'une crypto depuis CoinGecko
async function getPrice(symbol) {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`
    );
    const data = await response.json();
    return data[symbol]?.usd ?? null;
  } catch (error) {
    console.error(`❌ Erreur API pour ${symbol}:`, error.message);
    return null;
  }
}

// Vérification des alertes
async function checkAlerts() {
  const res = await db.query(`
    SELECT alerts.id, alerts.symbol, alerts.condition, alerts.value, users.telegram_id
    FROM alerts
    JOIN users ON alerts.user_id = users.id
  `);

  for (const alert of res.rows) {
    const symbol = alert.symbol.toLowerCase();
    const price = await getPrice(symbol);

    if (price === null) {
      console.log(`❌ Impossible d’obtenir le prix de ${symbol}`);
      continue;
    }

    const conditionMet =
      (alert.condition === ">" && price > alert.value) ||
      (alert.condition === "<" && price < alert.value);

    if (conditionMet) {
      try {
        await bot.api.sendMessage(
          alert.telegram_id,
          `🚨 Alerte déclenchée ! ${alert.symbol.toUpperCase()} ${alert.condition} ${alert.value} ➡ Prix actuel : ${price} USD`
        );

        await db.query("DELETE FROM alerts WHERE id = $1", [alert.id]);
        console.log(`✅ Alerte ${alert.id} envoyée et supprimée`);
      } catch (err) {
        console.error(`❌ Erreur d'envoi à ${alert.telegram_id} :`, err.message);
      }
    }
  }
}

// Exécution
checkAlerts()
  .then(() => {
    console.log("✔ Vérification des alertes terminée.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Erreur lors de la vérification :", err);
    process.exit(1);
  });

