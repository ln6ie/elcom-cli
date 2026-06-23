import * as SQLite from "expo-sqlite";

const DB_NAME = "elcomcli.db";

export interface DatabaseSettings {
  api_key: string | null;
  opencode_api_key: string | null;
  ai_provider: "openrouter" | "opencode";
  selected_model: string;
  system_prompt: string;
  max_tokens: number;
  temperature: number;
  context_length: number;
  user_name: string;
  language: "ar" | "en";
}

export const DEFAULT_SETTINGS: DatabaseSettings = {
  api_key: null,
  opencode_api_key: null,
  ai_provider: "openrouter",
  selected_model: "openrouter/free",
  system_prompt:
    "You are ElcomCLI, a professional AI terminal assistant. Help the user with their queries in a concise and technical manner.",
  max_tokens: 4096,
  temperature: 0.7,
  context_length: 25,
  user_name: "USER",
  language: "ar",
};

export const initDb = async (db: SQLite.SQLiteDatabase) => {
  try {
    // Settings table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Conversations table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT,
        model_id TEXT,
        repo_name TEXT,
        repo_owner TEXT,
        last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Messages table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        role TEXT,
        content TEXT,
        reasoning TEXT,
        attachment_uri TEXT,
        attachment_type TEXT,
        model_id TEXT,
        tool_call_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
      );
    `);

    // Migration: add tool_call_id column if missing (for existing databases)
    try {
      await db.execAsync(`ALTER TABLE messages ADD COLUMN tool_call_id TEXT;`);
    } catch (_) {
      // Column already exists — ignore
    }

    // Migration: Add model_id to messages if it doesn't exist
    try {
      await db.execAsync("ALTER TABLE messages ADD COLUMN model_id TEXT;");
    } catch (e) {
      // Column might already exist
    }

    // Migration: Add repo_name and repo_owner to conversations
    try {
      await db.execAsync("ALTER TABLE conversations ADD COLUMN repo_name TEXT;");
      await db.execAsync("ALTER TABLE conversations ADD COLUMN repo_owner TEXT;");
    } catch (e) {
      // Columns might already exist
    }

    // Custom Models table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS custom_models (
        id TEXT PRIMARY KEY,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Performance Indexes
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages(conversation_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_conv_last ON conversations(last_message_at);
    `);

    // Initialize default settings if they don't exist
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = ?",
        [key],
      );
      if (!existing) {
        await db.runAsync("INSERT INTO settings (key, value) VALUES (?, ?)", [
          key,
          value?.toString() || "",
        ]);
      }
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database: Initialization failed", error);
    throw error;
  }
};

export const database = {
  // Settings CRUD
  async getSettings(db: SQLite.SQLiteDatabase): Promise<DatabaseSettings> {
    const rows = await db.getAllAsync<{ key: string; value: string }>(
      "SELECT key, value FROM settings",
    );
    const settings: any = { ...DEFAULT_SETTINGS };
    rows.forEach((row) => {
      if (
        row.key === "max_tokens" ||
        row.key === "temperature" ||
        row.key === "context_length"
      ) {
        settings[row.key] = parseFloat(row.value);
      } else {
        settings[row.key] = row.value;
      }
    });
    return settings as DatabaseSettings;
  },

  async updateSetting(
    db: SQLite.SQLiteDatabase,
    key: string,
    value: string | number,
  ): Promise<void> {
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [key, value.toString()],
    );
  },

  // Conversation CRUD
  async createConversation(
    db: SQLite.SQLiteDatabase,
    id: string,
    title: string,
    modelId: string,
  ): Promise<void> {
    await db.runAsync(
      "INSERT INTO conversations (id, title, model_id) VALUES (?, ?, ?)",
      [id, title, modelId],
    );
  },

  async getAllConversations(db: SQLite.SQLiteDatabase) {
    return await db.getAllAsync(
      "SELECT * FROM conversations ORDER BY last_message_at DESC",
    );
  },

  async getConversationById(db: SQLite.SQLiteDatabase, id: string) {
    return await db.getFirstAsync<{
      id: string;
      title: string;
      model_id: string;
      repo_name: string | null;
      repo_owner: string | null;
    }>("SELECT * FROM conversations WHERE id = ?", [id]);
  },

  async deleteConversation(db: SQLite.SQLiteDatabase, id: string) {
    await db.runAsync("DELETE FROM conversations WHERE id = ?", [id]);
  },

  async updateConversationTitle(
    db: SQLite.SQLiteDatabase,
    id: string,
    title: string,
  ) {
    await db.runAsync("UPDATE conversations SET title = ? WHERE id = ?", [
      title,
      id,
    ]);
  },

  async updateConversationRepo(
    db: SQLite.SQLiteDatabase,
    id: string,
    repoName: string,
    repoOwner: string,
  ) {
    await db.runAsync("UPDATE conversations SET repo_name = ?, repo_owner = ? WHERE id = ?", [
      repoName, repoOwner, id,
    ]);
  },

  // Message CRUD
  async addMessage(
    db: SQLite.SQLiteDatabase,
    id: string,
    conversationId: string,
    role: string,
    content: string,
    reasoning?: string,
    attachmentUri?: string,
    attachmentType?: string,
    modelId?: string,
    tool_call_id?: string,
  ): Promise<void> {
    await db.runAsync(
      `INSERT INTO messages (id, conversation_id, role, content, reasoning, attachment_uri, attachment_type, model_id, tool_call_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        conversationId,
        role,
        content,
        reasoning || null,
        attachmentUri || null,
        attachmentType || null,
        modelId || null,
        tool_call_id || null,
      ],
    );
    // Update last_message_at in conversation
    await db.runAsync(
      "UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?",
      [conversationId],
    );
  },

  async getMessagesForConversation(
    db: SQLite.SQLiteDatabase,
    conversationId: string,
  ) {
    return await db.getAllAsync(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
      [conversationId],
    );
  },

  async deleteMessage(db: SQLite.SQLiteDatabase, messageId: string): Promise<void> {
    await db.runAsync("DELETE FROM messages WHERE id = ?", [messageId]);
  },

  async getMessagesPaginated(
    db: SQLite.SQLiteDatabase,
    conversationId: string,
    limit: number,
    offset: number,
  ) {
    return await db.getAllAsync(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [conversationId, limit, offset],
    );
  },

  // Custom Models
  async getCustomModels(db: SQLite.SQLiteDatabase) {
    return await db.getAllAsync<{ id: string; name: string }>(
      "SELECT * FROM custom_models ORDER BY created_at DESC",
    );
  },

  async addCustomModel(db: SQLite.SQLiteDatabase, id: string, name: string) {
    await db.runAsync("INSERT INTO custom_models (id, name) VALUES (?, ?)", [
      id,
      name,
    ]);
  },

  async deleteCustomModel(db: SQLite.SQLiteDatabase, id: string) {
    await db.runAsync("DELETE FROM custom_models WHERE id = ?", [id]);
  },

  async updateCustomModelName(
    db: SQLite.SQLiteDatabase,
    id: string,
    newName: string,
  ) {
    await db.runAsync("UPDATE custom_models SET name = ? WHERE id = ?", [
      newName,
      id,
    ]);
  },
};
