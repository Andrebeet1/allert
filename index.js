// index.js
import express from "express";
import { bot } from "./bot.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ✅ Route d'accueil simple
app.get("/", (req, res) => {
  res.send("🚀 TradeAlertBot est en ligne !");
});

// ✅ Webhook route : doit être **en-dehors** de la fonction `start`
app.post(`/webhook/${process.env.BOT_TOKEN}`, async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erreur handleUpdate :", err);
    res.sendStatus(500);
  }
});

// ✅ Lancer le bot + serveur
async function start() {
  try {
    await bot.init(); // Optionnel mais propre avec grammy

    app.listen(PORT, () => {
      console.log(`✅ Serveur démarré sur le port ${PORT}`);
      if (process.env.RENDER_EXTERNAL_HOSTNAME) {
        console.log(`🔗 Webhook : https://${process.env.RENDER_EXTERNAL_HOSTNAME}/webhook/${process.env.BOT_TOKEN}`);
      }
    });
  } catch (err) {
    console.error("❌ Échec du démarrage :", err);
  }
}

start();
