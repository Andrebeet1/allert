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
    const { rows } = await pool.query("SELECT message, chat_id FROM alerts WHERE sent = false");

    for (const alert of rows) {
      await bot.api.sendMessage(alert.chat_id, alert.message);
      await pool.query("UPDATE alerts SET sent = true WHERE chat_id = $1", [alert.chat_id]);
    }

    console.log("✅ Vérification des alertes terminée.");
  } catch (err) {
    console.error("❌ Erreur lors de la vérification :", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkAlerts();
