import express from 'express';
import { Bot } from 'grammy';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN);
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Fonction pour démarrer le bot et le serveur
async function start() {
  // 🔧 Initialiser le bot
  await bot.init();

  // 🎯 Route pour recevoir les mises à jour via webhook
  app.post(`/webhook/${process.env.BOT_TOKEN}`, (req, res) => {
    bot.handleUpdate(req.body)
      .then(() => res.sendStatus(200))
      .catch(err => {
        console.error('Erreur lors du traitement du webhook :', err);
        res.sendStatus(500);
      });
  });

  // 🌐 Lancer le serveur Express
  app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
    console.log(`🔗 Webhook configuré : https://${process.env.RENDER_EXTERNAL_HOSTNAME}/webhook/${process.env.BOT_TOKEN}`);
  });
}

start();
