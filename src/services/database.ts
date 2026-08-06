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
  onboarding_completed: boolean;
}

export type ServerAuthType = "password" | "private_key";

export interface ServerRecord {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  auth_type: ServerAuthType;
  fingerprint: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServerSnapshotRecord {
  id: string;
  server_id: string;
  payload: string;
  collected_at: string;
}

export interface ServerCapabilityRecord {
  server_id: string;
  capability_id: string;
  name: string;
  provider_id: string | null;
  status: "available" | "missing";
  version: string | null;
  discovered_at: string;
}

export interface ServerEventRecord {
  id: string;
  server_id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  details: string | null;
  source: string;
  created_at: string;
}

export interface ServerQueryRecord {
  id: string;
  server_id: string;
  name: string;
  command: string;
  created_at: string;
  updated_at: string;
  last_output: string | null;
  last_error: string | null;
  last_run_at: string | null;
}

export const DEFAULT_SETTINGS: DatabaseSettings = {
  api_key: null,
  opencode_api_key: null,
  ai_provider: "openrouter",
  selected_model: "openrouter/free",
  system_prompt:
    "You are Kimko CLI, a professional technical assistant for VPS management and repository workflows. Help the user concisely and technically.",
  max_tokens: 4096,
  temperature: 0.7,
  context_length: 25,
  user_name: "USER",
  language: "ar",
  onboarding_completed: false,
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
        tool_calls_json TEXT,
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

    // Migration: add tool_calls_json column if missing
    try {
      await db.execAsync(`ALTER TABLE messages ADD COLUMN tool_calls_json TEXT;`);
    } catch (_) {}   

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

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        host TEXT NOT NULL,
        port INTEGER NOT NULL DEFAULT 22,
        username TEXT NOT NULL,
        auth_type TEXT NOT NULL,
        fingerprint TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS server_snapshots (
        id TEXT PRIMARY KEY NOT NULL,
        server_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        collected_at TEXT NOT NULL,
        FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS server_events (
        id TEXT PRIMARY KEY NOT NULL,
        server_id TEXT NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'info',
        title TEXT NOT NULL,
        details TEXT,
        source TEXT NOT NULL DEFAULT 'runtime',
        created_at TEXT NOT NULL,
        FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS server_capabilities (
        server_id TEXT NOT NULL,
        capability_id TEXT NOT NULL,
        name TEXT NOT NULL,
        provider_id TEXT,
        status TEXT NOT NULL,
        version TEXT,
        discovered_at TEXT NOT NULL,
        PRIMARY KEY (server_id, capability_id),
        FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS server_deleted_capabilities (
        server_id TEXT NOT NULL,
        capability_id TEXT NOT NULL,
        deleted_at TEXT NOT NULL,
        PRIMARY KEY (server_id, capability_id),
        FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS server_queries (
        id TEXT PRIMARY KEY NOT NULL,
        server_id TEXT NOT NULL,
        name TEXT NOT NULL,
        command TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_output TEXT,
        last_error TEXT,
        last_run_at TEXT,
        FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_server_snapshots_server_date
        ON server_snapshots(server_id, collected_at DESC);
      CREATE INDEX IF NOT EXISTS idx_server_events_server_date
        ON server_events(server_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_server_queries_server_updated
        ON server_queries(server_id, updated_at DESC);
    `);

    try { await db.execAsync("ALTER TABLE server_events ADD COLUMN severity TEXT NOT NULL DEFAULT 'info'"); } catch (_) {}
    try { await db.execAsync("ALTER TABLE server_events ADD COLUMN source TEXT NOT NULL DEFAULT 'runtime'"); } catch (_) {}

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
    const settings: Record<string, string | number | boolean | null> = { ...DEFAULT_SETTINGS };
    rows.forEach((row) => {
      if (
        row.key === "max_tokens" ||
        row.key === "temperature" ||
        row.key === "context_length"
      ) {
        settings[row.key] = parseFloat(row.value);
      } else if (row.key === "onboarding_completed") {
        settings[row.key] = row.value === "true";
      } else {
        settings[row.key] = row.value;
      }
    });
    return settings as unknown as DatabaseSettings;
  },

  async updateSetting(
    db: SQLite.SQLiteDatabase,
    key: string,
    value: string | number | boolean,
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
    tool_calls_json?: string,
  ): Promise<void> {
    await db.runAsync(
      `INSERT INTO messages (id, conversation_id, role, content, reasoning, attachment_uri, attachment_type, model_id, tool_call_id, tool_calls_json) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        tool_calls_json || null,
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

  async getServers(db: SQLite.SQLiteDatabase): Promise<ServerRecord[]> {
    return db.getAllAsync<ServerRecord>(
      "SELECT * FROM servers ORDER BY updated_at DESC",
    );
  },

  async getServerById(db: SQLite.SQLiteDatabase, id: string): Promise<ServerRecord | null> {
    return db.getFirstAsync<ServerRecord>("SELECT * FROM servers WHERE id = ?", [id]);
  },

  async saveServer(db: SQLite.SQLiteDatabase, server: ServerRecord): Promise<void> {
    await db.runAsync(
      `INSERT OR REPLACE INTO servers
       (id, name, host, port, username, auth_type, fingerprint, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [server.id, server.name, server.host, server.port, server.username, server.auth_type,
        server.fingerprint, server.created_at, server.updated_at],
    );
  },

  async updateServerFingerprint(db: SQLite.SQLiteDatabase, id: string, fingerprint: string): Promise<void> {
    await db.runAsync("UPDATE servers SET fingerprint = ?, updated_at = ? WHERE id = ?", [
      fingerprint, new Date().toISOString(), id,
    ]);
  },

  async deleteServer(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
    await db.runAsync("DELETE FROM servers WHERE id = ?", [id]);
  },

  async saveServerSnapshot(db: SQLite.SQLiteDatabase, snapshot: ServerSnapshotRecord): Promise<void> {
    await db.runAsync(
      `INSERT OR REPLACE INTO server_snapshots (id, server_id, payload, collected_at)
       VALUES (?, ?, ?, ?)`,
      [snapshot.id, snapshot.server_id, snapshot.payload, snapshot.collected_at],
    );
    await db.runAsync(
      `DELETE FROM server_snapshots WHERE server_id = ? AND id NOT IN
       (SELECT id FROM server_snapshots WHERE server_id = ? ORDER BY collected_at DESC LIMIT 20)`,
      [snapshot.server_id, snapshot.server_id],
    );
  },

  async getLatestServerSnapshot(db: SQLite.SQLiteDatabase, serverId: string): Promise<ServerSnapshotRecord | null> {
    return db.getFirstAsync<ServerSnapshotRecord>(
      "SELECT * FROM server_snapshots WHERE server_id = ? ORDER BY collected_at DESC LIMIT 1",
      [serverId],
    );
  },

  async saveCapabilities(db: SQLite.SQLiteDatabase, capabilities: ServerCapabilityRecord[]): Promise<void> {
    await db.runAsync("BEGIN TRANSACTION");
    try {
      for (const capability of capabilities) {
        await db.runAsync(
          `INSERT OR REPLACE INTO server_capabilities
           (server_id, capability_id, name, provider_id, status, version, discovered_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [capability.server_id, capability.capability_id, capability.name, capability.provider_id, capability.status, capability.version, capability.discovered_at],
        );
      }
      await db.runAsync("COMMIT");
    } catch (error) {
      await db.runAsync("ROLLBACK");
      throw error;
    }
  },

  async getCapabilities(db: SQLite.SQLiteDatabase, serverId: string): Promise<ServerCapabilityRecord[]> {
    return db.getAllAsync<ServerCapabilityRecord>("SELECT capabilities.* FROM server_capabilities capabilities WHERE server_id = ? AND NOT EXISTS (SELECT 1 FROM server_deleted_capabilities deleted WHERE deleted.server_id = capabilities.server_id AND deleted.capability_id = capabilities.capability_id) ORDER BY name", [serverId]);
  },

  async deleteCapability(db: SQLite.SQLiteDatabase, serverId: string, capabilityId: string): Promise<void> {
    const related = await db.getAllAsync<{ capability_id: string }>("SELECT capability_id FROM server_capabilities WHERE server_id = ? AND (capability_id = ? OR provider_id = ?)", [serverId, capabilityId, capabilityId]);
    const ids = related.length ? related.map(item => item.capability_id) : [capabilityId];
    console.info("[Database] Deleting capabilities", { serverId, capabilityId, relatedIds: ids });
    await db.runAsync("BEGIN TRANSACTION");
    try {
      for (const id of ids) {
        await db.runAsync("INSERT OR REPLACE INTO server_deleted_capabilities (server_id, capability_id, deleted_at) VALUES (?, ?, ?)", [serverId, id, new Date().toISOString()]);
        await db.runAsync("DELETE FROM server_capabilities WHERE server_id = ? AND capability_id = ?", [serverId, id]);
      }
      await db.runAsync("COMMIT");
      console.info("[Database] Capabilities deleted", { serverId, capabilityId, count: ids.length });
    } catch (error) {
      await db.runAsync("ROLLBACK");
      throw error;
    }
  },

  async saveEvent(db: SQLite.SQLiteDatabase, event: ServerEventRecord): Promise<void> {
    await db.runAsync(
      `INSERT OR REPLACE INTO server_events
       (id, server_id, type, severity, title, details, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [event.id, event.server_id, event.type, event.severity, event.title, event.details, event.source, event.created_at],
    );
  },

  async getServerEvents(db: SQLite.SQLiteDatabase, serverId: string, limit = 50): Promise<ServerEventRecord[]> {
    return db.getAllAsync<ServerEventRecord>("SELECT * FROM server_events WHERE server_id = ? ORDER BY created_at DESC LIMIT ?", [serverId, limit]);
  },

  async saveServerQuery(db: SQLite.SQLiteDatabase, query: ServerQueryRecord): Promise<void> {
    await db.runAsync(
      `INSERT OR REPLACE INTO server_queries
       (id, server_id, name, command, created_at, updated_at, last_output, last_error, last_run_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [query.id, query.server_id, query.name, query.command, query.created_at, query.updated_at, query.last_output, query.last_error, query.last_run_at],
    );
  },

  async getServerQueries(db: SQLite.SQLiteDatabase, serverId: string): Promise<ServerQueryRecord[]> {
    return db.getAllAsync<ServerQueryRecord>("SELECT * FROM server_queries WHERE server_id = ? ORDER BY updated_at DESC", [serverId]);
  },

  async deleteServerQuery(db: SQLite.SQLiteDatabase, queryId: string): Promise<void> {
    await db.runAsync("DELETE FROM server_queries WHERE id = ?", [queryId]);
  },
};
