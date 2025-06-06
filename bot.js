bot.command("setalert", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);

  if (args.length !== 3) {
    return ctx.reply("❌ Format invalide. Utilise : /setalert BTC > 200");
  }

  let [symbol, condition, value] = args;
  symbol = symbol.toUpperCase().trim();
  condition = condition.trim();
  value = parseFloat(value);

  if (!['>', '<'].includes(condition) || isNaN(value)) {
    return ctx.reply("❌ Format incorrect. Exemple : /setalert BTC > 200");
  }

  try {
    const telegram_id = ctx.from.id;
    const username = ctx.from.username || null;
    const chat_id = ctx.chat.id;

    // Créer l'utilisateur s'il n'existe pas
    const userResult = await pool.query(
      `INSERT INTO users (telegram_id, username)
       VALUES ($1, $2)
       ON CONFLICT (telegram_id) DO NOTHING
       RETURNING id`,
      [telegram_id, username]
    );

    // Récupérer l'ID utilisateur
    const userId =
      userResult.rows[0]?.id ||
      (await pool.query(`SELECT id FROM users WHERE telegram_id = $1`, [telegram_id])).rows[0]?.id;

    if (!userId) {
      return ctx.reply("❌ Impossible de créer ou récupérer ton profil.");
    }

    // Vérifie si l’alerte existe déjà
    const exists = await pool.query(
      `SELECT 1 FROM alerts
       WHERE user_id = $1 AND symbol = $2 AND condition = $3 AND value = $4`,
      [userId, symbol, condition, value]
    );

    if (exists.rows.length > 0) {
      return ctx.reply(`⚠️ Cette alerte existe déjà : ${symbol} ${condition} ${value}`);
    }

    // Enregistre l’alerte
    await pool.query(
      `INSERT INTO alerts (user_id, symbol, condition, value, message, chat_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, symbol, condition, value,
        `🔔 Alerte déclenchée pour ${symbol} : valeur ${condition} ${value}`, chat_id]
    );

    ctx.reply(`✅ Alerte enregistrée pour ${symbol} ${condition} ${value}`);
  } catch (err) {
    console.error("❌ Erreur /setalert :", err);
    ctx.reply("❌ Une erreur est survenue. Réessaie plus tard.");
  }
});
