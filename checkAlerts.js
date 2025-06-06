import { Bot } from "grammy";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Vérifie la présence du token
const token = process.env.BOT_TOKEN;
if (!token || token.trim() === "") {
  throw new Error("❌ BOT_TOKEN manquant ! Ajoute-le dans Render ou dans le fichier .env.");
}

const bot = new Bot(token);

// Connexion PostgreSQL
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Obligatoire sur Render
});

async function checkAlerts() {
  try {
    const { rows } = await pool.query(
      "SELECT id, message, chat_id FROM alerts WHERE sent = false"
    );

    for (const alert of rows) {
      try {
        await bot.api.sendMessage(alert.chat_id, alert.message);

        await pool.query(
          "UPDATE alerts SET sent = true WHERE id = $1",
          [alert.id]
        );

        console.log(`✅ Message envoyé à chat_id=${alert.chat_id}`);
      } catch (err) {
        console.error(`❌ Erreur lors de l'envoi à ${alert.chat_id} :`, err.message);
      }
    }

    console.log("✅ Vérification des alertes terminée.");
  } catch (err) {
    console.error("❌ Erreur générale lors de la vérification :", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkAlerts();
