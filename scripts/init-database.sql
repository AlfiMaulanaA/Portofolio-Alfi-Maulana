-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    card_registered BOOLEAN DEFAULT FALSE,
    fingerprint_registered BOOLEAN DEFAULT FALSE,
    palm_registered BOOLEAN DEFAULT FALSE,
    face_registered BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME
);

-- Create History Log table
CREATE TABLE IF NOT EXISTS history_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_name TEXT NOT NULL,
    recognition_type TEXT NOT NULL CHECK (recognition_type IN ('palm', 'face', 'fingerprint', 'card')),
    result TEXT NOT NULL CHECK (result IN ('success', 'failed', 'unknown')),
    confidence REAL DEFAULT 0,
    location TEXT DEFAULT 'Main Entrance',
    device_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON history_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_history_type ON history_logs(recognition_type);

-- No default users - clean database
-- Users will be created through the UI
