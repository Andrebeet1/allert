// bot.js
import { Bot, InlineKeyboard } from "grammy";
import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

// Chargement des variables d'environnement
dotenv.config();

// Initialisation du bot Telegram
const bot = new Bot(process.env.BOT_TOKEN);

// Connexion sécurisée à la base de données PostgreSQL (Render)
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Mémoire temporaire pour suivre l'état des utilisateurs
const memory = new Map();

// Supprime le dernier message du bot pour éviter l'encombrement
async function cleanLast(userId, ctx) {
  const state = memory.get(userId);
  if (state?.lastMessageId) {
    try {
      await ctx.api.deleteMessage(userId, state.lastMessageId);
    } catch (e) {
      console.log("❗ Suppression échouée :", e.message);
    }
  }
}

// Commande /start
bot.command("start", async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username;

  await db.query(
    "INSERT INTO users (telegram_id, username) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [userId, username]
  );

  const keyboard = new InlineKeyboard()
    .text("📈 Graphique", "chart")
    .row()
    .text("⚙️ Créer une alerte", "alerte")
    .text("ℹ️ À propos", "about");

  await ctx.reply("Bienvenue sur TradeAlertBot 📊", {
    reply_markup: keyboard,
  });
});

// Bouton "Graphique"
bot.callbackQuery("chart", async (ctx) => {
  await ctx.replyWithPhoto(
    "https://quickchart.io/chart?c={type:'line',data:{labels:['Mon','Tue','Wed'],datasets:[{label:'BTC',data:[21000,22000,23000]}]}}"
  );
  await ctx.answerCallbackQuery();
});

// Bouton "À propos"
bot.callbackQuery("about", async (ctx) => {
  await ctx.reply("Ce bot vous permet de créer des alertes crypto.\nCréé par @ton_username");
  await ctx.answerCallbackQuery();
});

// Bouton "Créer une alerte"
bot.callbackQuery("alerte", async (ctx) => {
  const userId = ctx.from.id;
  await cleanLast(userId, ctx);
  memory.set(userId, { step: "symbol" });
  const sent = await ctx.reply("🔤 Entrez le symbole (ex : BTC, ETH) :");
  memory.get(userId).lastMessageId = sent.message_id;
  await ctx.answerCallbackQuery();
});

// Réponse aux messages texte
bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  const state = memory.get(userId);
  if (!state) return;

  await cleanLast(userId, ctx);

  if (state.step === "symbol") {
    state.symbol = ctx.message.text.toUpperCase();
    state.step = "condition";

    const keyboard = new InlineKeyboard()
      .text("⬆️ Supérieur", "cond_sup")
      .text("⬇️ Inférieur", "cond_inf");

    const sent = await ctx.reply("🧠 Choisissez la condition :", {
      reply_markup: keyboard,
    });
    state.lastMessageId = sent.message_id;

  } else if (state.step === "value") {
    const value = parseFloat(ctx.message.text);
    if (isNaN(value)) {
      return ctx.reply("❌ Ce n’est pas un nombre valide.");
    }

    state.value = value;

    // Sauvegarde dans la base
    const res = await db.query("SELECT id FROM users WHERE telegram_id = $1", [userId]);
    const user_db_id = res.rows[0]?.id;
    if (!user_db_id) return ctx.reply("❌ Utilisateur non trouvé.");

    await db.query(
      "INSERT INTO alerts (user_id, symbol, condition, value) VALUES ($1, $2, $3, $4)",
      [user_db_id, state.symbol, state.condition, state.value]
    );

    memory.delete(userId);

    await ctx.reply(`✅ Alerte enregistrée : ${state.symbol} ${state.condition} ${state.value}`);
  }
});

// Callback pour les conditions (supérieur/inférieur)
bot.callbackQuery(/cond_.*/, async (ctx) => {
  const userId = ctx.from.id;
  const state = memory.get(userId);
  if (!state) return;

  state.condition = ctx.match[0] === "cond_sup" ? ">" : "<";
  state.step = "value";

  const sent = await ctx.reply("💲 Entrez la valeur de déclenchement :");
  state.lastMessageId = sent.message_id;
  await ctx.answerCallbackQuery();
});

// Export du bot
export { bot };
