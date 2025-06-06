import { Bot } from "grammy";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// 🔐 Chargement du token depuis la variable BOT_TOKEN
const token = process.env.BOT_TOKEN;

if (!token || token.trim() === "") {
  throw new Error("❌ BOT_TOKEN manquant ! Assure-toi de l'avoir défini dans Render (ou fichier .env en local).");
}

const bot = new Bot(token);

// 📦 Connexion à la base de données PostgreSQL
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Requis sur Render
  },
});

async function checkAlerts() {
  try {
    // On récupère toutes les alertes non envoyées avec les infos nécessaires
    const { rows } = await pool.query(`
      SELECT alerts.id, alerts.symbol, alerts.condition, alerts.value, users.telegram_id
      FROM alerts
      JOIN users ON alerts.user_id = users.id
      WHERE alerts.sent = false
    `);

    for (const alert of rows) {
      // Construction dynamique du message
      const message = `🔔 Alerte déclenchée pour ${alert.symbol} : valeur ${alert.condition} ${alert.value}`;

      // Envoi du message
      await bot.api.sendMessage(alert.telegram_id, message);

      // Marquage de l'alerte comme envoyée
      await pool.query("UPDATE alerts SET sent = true WHERE id = $1", [alert.id]);
    }

    console.log("✅ Vérification des alertes terminée.");
  } catch (err) {
    console.error("❌ Erreur générale lors de la vérification :", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkAlerts();

