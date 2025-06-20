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

-- Insert admin user
INSERT OR IGNORE INTO users (
    name, 
    email, 
    department, 
    status, 
    card_registered, 
    fingerprint_registered, 
    palm_registered, 
    face_registered,
    last_seen
) VALUES (
    'System Administrator',
    'admin@biometric.system',
    'IT Administration',
    'active',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP
);

-- Insert some sample users for testing
INSERT OR IGNORE INTO users (name, email, department, status, card_registered, fingerprint_registered, palm_registered, face_registered, last_seen) VALUES
('John Doe', 'john.doe@company.com', 'Engineering', 'active', TRUE, TRUE, TRUE, FALSE, '2024-01-15 09:30:00'),
('Jane Smith', 'jane.smith@company.com', 'Marketing', 'active', TRUE, FALSE, TRUE, TRUE, '2024-01-15 08:45:00'),
('Mike Johnson', 'mike.johnson@company.com', 'Sales', 'inactive', TRUE, TRUE, FALSE, FALSE, '2024-01-10 16:20:00'),
('Sarah Wilson', 'sarah.wilson@company.com', 'HR', 'active', TRUE, TRUE, TRUE, TRUE, '2024-01-15 10:15:00'),
('David Brown', 'david.brown@company.com', 'Finance', 'active', FALSE, TRUE, TRUE, FALSE, '2024-01-14 17:30:00');

-- Insert some sample history logs
INSERT OR IGNORE INTO history_logs (user_id, user_name, recognition_type, result, confidence, location, timestamp) VALUES
(1, 'System Administrator', 'palm', 'success', 95.5, 'Main Entrance', '2024-01-15 09:00:00'),
(2, 'John Doe', 'face', 'success', 87.2, 'Lab Door', '2024-01-15 09:30:00'),
(3, 'Jane Smith', 'palm', 'success', 92.1, 'Main Entrance', '2024-01-15 08:45:00'),
(NULL, 'Unknown Person', 'face', 'unknown', 45.3, 'Server Room', '2024-01-15 10:00:00'),
(4, 'Mike Johnson', 'fingerprint', 'failed', 23.1, 'Executive Floor', '2024-01-10 16:20:00');
