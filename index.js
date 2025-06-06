// index.js
import express from "express";
import { bot } from "./bot.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN; // Exemple : https://ton-app.onrender.com
const SECRET_PATH = `/webhook/${bot.token}`;

// Démarrer le bot en mode webhook
app.use(express.json());
app.use(SECRET_PATH, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// Vérifie que le serveur fonctionne
app.get("/", (req, res) => {
  res.send("🚀 TradeAlertBot est en ligne !");
});

// Lance le serveur
app.listen(port, async () => {
  console.log(`✅ Serveur démarré sur le port ${port}`);

  if (!DOMAIN) {
    console.error("❌ Erreur : DOMAIN n'est pas défini dans .env");
    return;
  }

  // Définir le webhook Telegram
  const webhookUrl = `${DOMAIN}${SECRET_PATH}`;
  try {
    await bot.api.setWebhook(webhookUrl);
    console.log(`🔗 Webhook configuré : ${webhookUrl}`);
  } catch (err) {
    console.error("❌ Échec configuration webhook :", err.message);
  }
});
