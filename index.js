// index.js
import express from "express";
import { bot } from "./bot.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ✅ Route d'accueil pour éviter "Cannot GET /"
app.get("/", (req, res) => {
  res.send("🚀 TradeAlertBot est en ligne !");
});

// Démarrage du serveur et initialisation du bot
async function start() {
  try {
    await bot.init(); // Initialiser le bot

    // ✅ Route pour le webhook Telegram
    app.post(`/webhook/${process.env.BOT_TOKEN}`, async (req, res) => {
      try {
        await bot.handleUpdate(req.body);
        res.sendStatus(200);
      } catch (err) {
        console.error("❌ Erreur dans handleUpdate :", err);
        res.sendStatus(500);
      }
    });

    // ✅ Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`✅ Serveur démarré sur le port ${PORT}`);
      if (process.env.RENDER_EXTERNAL_HOSTNAME) {
        console.log(`🔗 Webhook : https://${process.env.RENDER_EXTERNAL_HOSTNAME}/webhook/${process.env.BOT_TOKEN}`);
      }
    });
  } catch (err) {
    console.error("❌ Erreur lors du démarrage du bot :", err);
  }
}

start();
