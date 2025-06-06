// setWebhook.js
import { bot } from "./bot.js";
import dotenv from "dotenv";

dotenv.config();

const url = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/webhook/${bot.token}`;

bot.api.setWebhook(url)
  .then(() => console.log(`✅ Webhook défini : ${url}`))
  .catch((err) => console.error("❌ Erreur setWebhook :", err));
