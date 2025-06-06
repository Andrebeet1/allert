-- Table des utilisateurs Telegram
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT
);

-- Table des alertes
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    condition TEXT CHECK (condition IN ('>', '<')) NOT NULL,
    value NUMERIC NOT NULL
);
