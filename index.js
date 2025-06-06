// index.js
import express from "express";
import { bot } from "./bot.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Démarrage du serveur et initialisation du bot
async function start() {
  await bot.init(); // ✅ Initialiser le bot

  app.post(`/webhook/${process.env.BOT_TOKEN}`, async (req, res) => {
    try {
      await bot.handleUpdate(req.body); // ✅ Fonctionne seulement après .init()
      res.sendStatus(200);
    } catch (err) {
      console.error("Erreur handleUpdate :", err);
      res.sendStatus(500);
    }
  });

  app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
    console.log(`🔗 Webhook configuré : https://${process.env.RENDER_EXTERNAL_HOSTNAME}/webhook/${process.env.BOT_TOKEN}`);
  });
}

start();
