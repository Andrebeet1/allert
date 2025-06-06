import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Obligatoire pour Render
  },
});

const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        symbol TEXT NOT NULL,
        condition TEXT NOT NULL CHECK (condition IN ('>', '<')),
        value NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Base de données initialisée avec succès !");
    await pool.end();
  } catch (error) {
    console.error("❌ Erreur d'initialisation de la base :", error.message);
    process.exit(1);
  }
};

initDb();

