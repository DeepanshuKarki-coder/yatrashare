import fs from 'fs';
import path from 'path';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { Pool, PoolClient } from 'pg';
import { env } from '../config/env';
import { logger } from '../config/logger';

export interface DatabaseClient {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ changes: number }>;
}

class AsyncMutex {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    if (this.locked) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.locked = true;
    return () => {
      this.locked = false;
      const next = this.queue.shift();
      if (next) next();
    };
  }
}

class DatabaseManager implements DatabaseClient {
  private pgPool: Pool | null = null;
  private sqlJsDb: SqlJsDatabase | null = null;
  private dbPath: string = '';
  private isPg: boolean = false;
  private initialized: boolean = false;
  private txMutex = new AsyncMutex();
  private inTransaction: boolean = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    if (env.DATABASE_URL.startsWith('postgres://') || env.DATABASE_URL.startsWith('postgresql://')) {
      this.isPg = true;
      this.pgPool = new Pool({
        connectionString: env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      logger.info('Connected to PostgreSQL database pool');
      await this.runMigrations();
    } else {
      this.isPg = false;
      const SQL = await initSqlJs();
      const sqlitePath = env.DATABASE_URL.replace('sqlite://', '');
      this.dbPath = path.resolve(process.cwd(), sqlitePath);

      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      if (fs.existsSync(this.dbPath)) {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.sqlJsDb = new SQL.Database(fileBuffer);
        logger.info(`Loaded existing SQLite database from ${this.dbPath}`);
      } else {
        this.sqlJsDb = new SQL.Database();
        logger.info(`Created new in-memory/file SQLite database at ${this.dbPath}`);
      }

      await this.runMigrations();
      this.persistSqlite();
    }

    this.initialized = true;
  }

  private persistSqlite(): void {
    if (!this.sqlJsDb || !this.dbPath || this.dbPath.includes(':memory:')) return;
    try {
      const data = this.sqlJsDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      logger.error('Failed to persist SQLite database to disk', err);
    }
  }

  private async runMigrations(): Promise<void> {
    const candidates = [
      path.resolve(__dirname, 'schema.sql'),
      path.resolve(__dirname, '../../src/models/schema.sql'),
      path.resolve(process.cwd(), 'src/models/schema.sql'),
      path.resolve(process.cwd(), 'backend/src/models/schema.sql'),
    ];
    const schemaPath = candidates.find((p) => fs.existsSync(p));
    if (!schemaPath) {
      logger.warn('Schema file not found in candidates');
      return;
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    if (this.isPg && this.pgPool) {
      await this.pgPool.query(schemaSql);
      logger.info('PostgreSQL schema migrations applied successfully');
    } else if (this.sqlJsDb) {
      this.sqlJsDb.run(schemaSql);
      logger.info('SQLite schema migrations applied successfully');
    }
  }

  /**
   * Translates Postgres-style $1, $2 to SQLite-compatible ?1, ?2
   */
  private prepareSqlForDriver(sql: string): string {
    if (this.isPg) return sql;
    return sql.replace(/\$\d+/g, '?');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await this.init();
    const preparedSql = this.prepareSqlForDriver(sql);

    if (this.isPg && this.pgPool) {
      const res = await this.pgPool.query(preparedSql, params);
      return res.rows as T[];
    }

    if (this.sqlJsDb) {
      const stmt = this.sqlJsDb.prepare(preparedSql);
      stmt.bind(params);
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as unknown as T);
      }
      stmt.free();
      return results;
    }

    throw new Error('Database not initialized');
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async execute(sql: string, params: any[] = []): Promise<{ changes: number }> {
    await this.init();
    const preparedSql = this.prepareSqlForDriver(sql);

    if (this.isPg && this.pgPool) {
      const res = await this.pgPool.query(preparedSql, params);
      return { changes: res.rowCount || 0 };
    }

    if (this.sqlJsDb) {
      this.sqlJsDb.run(preparedSql, params);
      const changesRes = this.sqlJsDb.exec('SELECT changes() as cnt');
      const changes = (changesRes[0]?.values[0]?.[0] as number) || 0;
      if (!this.inTransaction) {
        this.persistSqlite();
      }
      return { changes };
    }

    throw new Error('Database not initialized');
  }

  async transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T> {
    await this.init();

    if (this.isPg && this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');
        const txClient: DatabaseClient = {
          query: async (sql, params = []) => {
            const res = await client.query(sql, params);
            return res.rows;
          },
          queryOne: async (sql, params = []) => {
            const res = await client.query(sql, params);
            return res.rows.length > 0 ? res.rows[0] : null;
          },
          execute: async (sql, params = []) => {
            const res = await client.query(sql, params);
            return { changes: res.rowCount || 0 };
          },
        };

        const result = await callback(txClient);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    if (this.sqlJsDb) {
      const release = await this.txMutex.acquire();
      this.inTransaction = true;
      try {
        this.sqlJsDb.run('BEGIN TRANSACTION');
        try {
          const txClient: DatabaseClient = {
            query: (sql, params) => this.query(sql, params),
            queryOne: (sql, params) => this.queryOne(sql, params),
            execute: (sql, params) => this.execute(sql, params),
          };
          const result = await callback(txClient);
          this.sqlJsDb.run('COMMIT');
          this.inTransaction = false;
          this.persistSqlite();
          return result;
        } catch (err) {
          try {
            this.sqlJsDb.run('ROLLBACK');
          } catch (rbErr) {
            // Ignore if rollback already happened
          }
          throw err;
        }
      } finally {
        this.inTransaction = false;
        release();
      }
    }

    throw new Error('Database not initialized');
  }

  async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    if (this.sqlJsDb) {
      this.persistSqlite();
      this.sqlJsDb.close();
    }
    this.initialized = false;
  }
}

export const db = new DatabaseManager();
