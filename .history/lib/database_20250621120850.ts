import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  status: "active" | "inactive";
  card_registered: boolean;
  fingerprint_registered: boolean;
  palm_registered: boolean;
  face_registered: boolean;
  face_api_id: number | null; // New field for Face API ID
  created_at: string;
  updated_at: string;
  last_seen: string | null;
}

export interface CreateUserData {
  name: string;
  email: string;
  department: string;
  status?: "active" | "inactive";
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  department?: string;
  status?: "active" | "inactive";
  card_registered?: boolean;
  fingerprint_registered?: boolean;
  palm_registered?: boolean;
  face_registered?: boolean;
  face_api_id?: number | null; // New field
  last_seen?: string;
}

export interface HistoryLog {
  id: number;
  user_id: number | null;
  user_name: string;
  recognition_type: "palm" | "face" | "fingerprint" | "card";
  result: "success" | "failed" | "unknown";
  confidence: number;
  location: string;
  device_id: string | null;
  timestamp: string;
}

export interface CreateHistoryLogData {
  user_id?: number | null;
  user_name: string;
  recognition_type: "palm" | "face" | "fingerprint" | "card";
  result: "success" | "failed" | "unknown";
  confidence?: number;
  location?: string;
  device_id?: string;
}

class DatabaseService {
  public db: Database.Database; // Make this public for direct access
  private static instance: DatabaseService;

  private constructor() {
    // Create database directory if it doesn't exist
    const dbDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize database
    const dbPath = path.join(dbDir, "biometric.db");
    this.db = new Database(dbPath);

    // Enable foreign keys
    this.db.pragma("foreign_keys = ON");

    // Initialize tables
    this.initializeTables();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private checkColumnExists(tableName: string, columnName: string): boolean {
    try {
      const tableInfo = this.db.pragma(`table_info(${tableName})`);
      return tableInfo.some((column: any) => column.name === columnName);
    } catch (error) {
      console.error(
        `Error checking column ${columnName} in table ${tableName}:`,
        error
      );
      return false;
    }
  }

  private initializeTables() {
    // Create Users table (without face_api_id first)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        department TEXT NOT NULL,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        card_registered INTEGER DEFAULT 0,
        fingerprint_registered INTEGER DEFAULT 0,
        palm_registered INTEGER DEFAULT 0,
        face_registered INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME
      )
    `);

    // Add face_api_id column if it doesn't exist
    if (!this.checkColumnExists("users", "face_api_id")) {
      try {
        this.db.exec(
          `ALTER TABLE users ADD COLUMN face_api_id INTEGER DEFAULT NULL`
        );
      } catch (error) {
        console.error("Error adding face_api_id column:", error);
      }
    }

    // Create History Log table
    this.db.exec(`
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
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      CREATE INDEX IF NOT EXISTS idx_history_user_id ON history_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_history_type ON history_logs(recognition_type);
    `);

    // Create face_api_id index if column exists
    if (this.checkColumnExists("users", "face_api_id")) {
      this.db.exec(
        `CREATE INDEX IF NOT EXISTS idx_users_face_api_id ON users(face_api_id);`
      );
    }

    // Insert admin user if not exists
    const adminExists = this.db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get("admin@biometric.system");
    if (!adminExists) {
      // Check if face_api_id column exists before inserting
      const hasFaceApiId = this.checkColumnExists("users", "face_api_id");

      if (hasFaceApiId) {
        this.db
          .prepare(
            `
          INSERT INTO users (name, email, department, status, card_registered, fingerprint_registered, palm_registered, face_registered, face_api_id, last_seen)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            "System Administrator",
            "admin@biometric.system",
            "IT Administration",
            "active",
            1, // true as 1
            1, // true as 1
            1, // true as 1
            1, // true as 1
            null, // face_api_id
            new Date().toISOString()
          );

        // Insert sample users
        const sampleUsers = [
          [
            "John Doe",
            "john.doe@company.com",
            "Engineering",
            "active",
            1,
            1,
            1,
            0,
            null,
            "2024-01-15 09:30:00",
          ],
          [
            "Jane Smith",
            "jane.smith@company.com",
            "Marketing",
            "active",
            1,
            0,
            1,
            1,
            null,
            "2024-01-15 08:45:00",
          ],
          [
            "Mike Johnson",
            "mike.johnson@company.com",
            "Sales",
            "inactive",
            1,
            1,
            0,
            0,
            null,
            "2024-01-10 16:20:00",
          ],
          [
            "Sarah Wilson",
            "sarah.wilson@company.com",
            "HR",
            "active",
            1,
            1,
            1,
            1,
            null,
            "2024-01-15 10:15:00",
          ],
          [
            "David Brown",
            "david.brown@company.com",
            "Finance",
            "active",
            0,
            1,
            1,
            0,
            null,
            "2024-01-14 17:30:00",
          ],
        ];

        const insertUser = this.db.prepare(`
          INSERT INTO users (name, email, department, status, card_registered, fingerprint_registered, palm_registered, face_registered, face_api_id, last_seen)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const user of sampleUsers) {
          insertUser.run(...user);
        }
      } else {
        // Insert without face_api_id column
        this.db
          .prepare(
            `
          INSERT INTO users (name, email, department, status, card_registered, fingerprint_registered, palm_registered, face_registered, last_seen)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            "System Administrator",
            "admin@biometric.system",
            "IT Administration",
            "active",
            1, // true as 1
            1, // true as 1
            1, // true as 1
            1, // true as 1
            new Date().toISOString()
          );

        // Insert sample users without face_api_id
        const sampleUsers = [
          [
            "John Doe",
            "john.doe@company.com",
            "Engineering",
            "active",
            1,
            1,
            1,
            0,
            "2024-01-15 09:30:00",
          ],
          [
            "Jane Smith",
            "jane.smith@company.com",
            "Marketing",
            "active",
            1,
            0,
            1,
            1,
            "2024-01-15 08:45:00",
          ],
          [
            "Mike Johnson",
            "mike.johnson@company.com",
            "Sales",
            "inactive",
            1,
            1,
            0,
            0,
            "2024-01-10 16:20:00",
          ],
          [
            "Sarah Wilson",
            "sarah.wilson@company.com",
            "HR",
            "active",
            1,
            1,
            1,
            1,
            "2024-01-15 10:15:00",
          ],
          [
            "David Brown",
            "david.brown@company.com",
            "Finance",
            "active",
            0,
            1,
            1,
            0,
            "2024-01-14 17:30:00",
          ],
        ];

        const insertUser = this.db.prepare(`
          INSERT INTO users (name, email, department, status, card_registered, fingerprint_registered, palm_registered, face_registered, last_seen)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const user of sampleUsers) {
          insertUser.run(...user);
        }
      }
    }
  }

  // Helper function to convert SQLite integers to booleans
  private convertUserFromDb(user: any): User {
    return {
      ...user,
      card_registered: Boolean(user.card_registered),
      fingerprint_registered: Boolean(user.fingerprint_registered),
      palm_registered: Boolean(user.palm_registered),
      face_registered: Boolean(user.face_registered),
      face_api_id: user.face_api_id || null, // Handle undefined as null
    };
  }

  // User CRUD operations
  public getAllUsers(): User[] {
    const users = this.db
      .prepare("SELECT * FROM users ORDER BY created_at DESC")
      .all();
    return users.map((user) => this.convertUserFromDb(user));
  }

  public getUserById(id: number): User | null {
    const user = this.db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    return user ? this.convertUserFromDb(user) : null;
  }

  public getUserByEmail(email: string): User | null {
    const user = this.db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);
    return user ? this.convertUserFromDb(user) : null;
  }

  public getUserByFaceApiId(faceApiId: number): User | null {
    if (!this.checkColumnExists("users", "face_api_id")) {
      console.warn("face_api_id column does not exist");
      return null;
    }
    const user = this.db
      .prepare("SELECT * FROM users WHERE face_api_id = ?")
      .get(faceApiId);
    return user ? this.convertUserFromDb(user) : null;
  }

  public createUser(userData: CreateUserData): User {
    const stmt = this.db.prepare(`
      INSERT INTO users (name, email, department, status)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      userData.name,
      userData.email,
      userData.department,
      userData.status || "active"
    );

    return this.getUserById(result.lastInsertRowid as number)!;
  }

  public updateUser(id: number, userData: UpdateUserData): User | null {
    const user = this.getUserById(id);
    if (!user) return null;

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(userData)) {
      if (value !== undefined) {
        // Skip face_api_id if column doesn't exist
        if (
          key === "face_api_id" &&
          !this.checkColumnExists("users", "face_api_id")
        ) {
          console.warn("Skipping face_api_id update - column does not exist");
          continue;
        }

        // Convert boolean to integer for SQLite
        if (typeof value === "boolean") {
          fields.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    }

    if (fields.length === 0) return user;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE users SET ${fields.join(", ")} WHERE id = ?
    `);

    stmt.run(...values);
    return this.getUserById(id);
  }

  public deleteUser(id: number): boolean {
    const result = this.db.prepare("DELETE FROM users WHERE id = ?").run(id);
    return result.changes > 0;
  }

  public updateUserRegistration(
    id: number,
    type: "card" | "fingerprint" | "palm" | "face",
    registered: boolean
  ): User | null {
    const field = `${type}_registered`;
    return this.updateUser(id, { [field]: registered });
  }

  public updateUserLastSeen(id: number): User | null {
    return this.updateUser(id, { last_seen: new Date().toISOString() });
  }

  public updateUserFaceApiId(id: number, faceApiId: number): User | null {
    if (!this.checkColumnExists("users", "face_api_id")) {
      console.warn("Cannot update face_api_id - column does not exist");
      return this.getUserById(id);
    }
    return this.updateUser(id, { face_api_id: faceApiId });
  }

  // History Log operations
  public getAllHistoryLogs(limit?: number): HistoryLog[] {
    const query = limit
      ? "SELECT * FROM history_logs ORDER BY timestamp DESC LIMIT ?"
      : "SELECT * FROM history_logs ORDER BY timestamp DESC";

    return limit
      ? (this.db.prepare(query).all(limit) as HistoryLog[])
      : (this.db.prepare(query).all() as HistoryLog[]);
  }

  public getHistoryLogsByUserId(userId: number): HistoryLog[] {
    return this.db
      .prepare(
        "SELECT * FROM history_logs WHERE user_id = ? ORDER BY timestamp DESC"
      )
      .all(userId) as HistoryLog[];
  }

  public createHistoryLog(logData: CreateHistoryLogData): HistoryLog {
    const stmt = this.db.prepare(`
      INSERT INTO history_logs (user_id, user_name, recognition_type, result, confidence, location, device_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      logData.user_id || null,
      logData.user_name,
      logData.recognition_type,
      logData.result,
      logData.confidence || 0,
      logData.location || "Main Entrance",
      logData.device_id || null
    );

    return this.db
      .prepare("SELECT * FROM history_logs WHERE id = ?")
      .get(result.lastInsertRowid) as HistoryLog;
  }

  // Statistics - Fixed SQL queries
  public getUserStats() {
    try {
      const total = this.db
        .prepare("SELECT COUNT(*) as count FROM users")
        .get() as { count: number };
      const active = this.db
        .prepare("SELECT COUNT(*) as count FROM users WHERE status = ?")
        .get("active") as {
        count: number;
      };
      const palmRegistered = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM users WHERE palm_registered = 1"
        )
        .get() as {
        count: number;
      };
      const faceRegistered = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM users WHERE face_registered = 1"
        )
        .get() as {
        count: number;
      };

      let faceApiSynced = 0;
      if (this.checkColumnExists("users", "face_api_id")) {
        const result = this.db
          .prepare(
            "SELECT COUNT(*) as count FROM users WHERE face_api_id IS NOT NULL"
          )
          .get() as {
          count: number;
        };
        faceApiSynced = result.count;
      }

      return {
        total: total.count,
        active: active.count,
        palmRegistered: palmRegistered.count,
        faceRegistered: faceRegistered.count,
        faceApiSynced: faceApiSynced,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return {
        total: 0,
        active: 0,
        palmRegistered: 0,
        faceRegistered: 0,
        faceApiSynced: 0,
      };
    }
  }

  public getHistoryStats() {
    try {
      const total = this.db
        .prepare("SELECT COUNT(*) as count FROM history_logs")
        .get() as { count: number };
      const success = this.db
        .prepare("SELECT COUNT(*) as count FROM history_logs WHERE result = ?")
        .get("success") as {
        count: number;
      };
      const palmScans = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM history_logs WHERE recognition_type = ?"
        )
        .get("palm") as { count: number };
      const faceScans = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM history_logs WHERE recognition_type = ?"
        )
        .get("face") as { count: number };

      return {
        total: total.count,
        successRate:
          total.count > 0 ? Math.round((success.count / total.count) * 100) : 0,
        palmScans: palmScans.count,
        faceScans: faceScans.count,
      };
    } catch (error) {
      console.error("Error getting history stats:", error);
      return {
        total: 0,
        successRate: 0,
        palmScans: 0,
        faceScans: 0,
      };
    }
  }

  public close() {
    this.db.close();
  }
}

export default DatabaseService;
