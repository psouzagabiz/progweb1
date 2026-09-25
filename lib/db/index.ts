import { Pool, type QueryResultRow } from "pg";
import path from "path";
import fs from "fs";

// Vercel's serverless filesystem is read-only except for /tmp, and /tmp is
// ephemeral (wiped between cold starts / across instances). File uploads
// still use it there (see uploadsDir below) for demo/visualization purposes,
// but all structured data now lives in a real Postgres database (Supabase),
// which actually persists across invocations/instances.
const isServerless = !!process.env.VERCEL;
const baseDir = isServerless ? "/tmp/wedding-finance" : process.cwd();

export const uploadsDir = path.join(baseDir, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Vercel/Supabase integrations can inject slightly different env var names
// depending on how the storage integration is set up, so read defensively.
const rawConnectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var __wfPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __wfMigrated: Promise<void> | undefined;
}

function createPool(): Pool {
  if (!rawConnectionString) {
    throw new Error(
      "No Postgres connection string found. Set POSTGRES_URL (or POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING / DATABASE_URL)."
    );
  }
  const noSsl = /sslmode=disable/.test(rawConnectionString);
  // Strip any sslmode param from the URL itself: pg-connection-string parses
  // it into its own ssl config (e.g. sslmode=require -> ssl:true with cert
  // verification ON), which can override/conflict with the explicit `ssl`
  // option below. Supabase's pooler uses a cert Node doesn't trust by
  // default, so we always want relaxed verification explicitly instead.
  const connectionString = rawConnectionString.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, "");
  return new Pool({
    connectionString,
    ssl: noSsl ? undefined : { rejectUnauthorized: false },
  });
}

function getPool(): Pool {
  if (!global.__wfPool) {
    global.__wfPool = createPool();
  }
  return global.__wfPool;
}

/**
 * Returns a ready-to-use Postgres pool, running migrations (and, on Vercel,
 * the first-run demo seed) exactly once per server instance.
 */
export async function getDb(): Promise<Pool> {
  const pool = getPool();
  if (!global.__wfMigrated) {
    global.__wfMigrated = (async () => {
      const isNewDb = await isDatabaseEmpty(pool);
      await migrate(pool);
      if (isServerless && isNewDb) {
        const { seedDemoData } = await import("../../scripts/seed");
        await seedDemoData(pool);
      }
    })();
  }
  await global.__wfMigrated;
  return pool;
}

async function isDatabaseEmpty(pool: Pool): Promise<boolean> {
  try {
    const res = await pool.query(
      `SELECT to_regclass('public.users') as reg`
    );
    return !res.rows[0]?.reg;
  } catch {
    return true;
  }
}

async function migrate(pool: Pool) {
  await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS weddings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    noivo1 TEXT NOT NULL DEFAULT '',
    noivo2 TEXT NOT NULL DEFAULT '',
    data_casamento TEXT,
    orcamento_maximo_cents BIGINT NOT NULL DEFAULT 0,
    observacoes TEXT NOT NULL DEFAULT '',
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS categoria_orcamentos (
    id TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    categoria TEXT NOT NULL,
    orcamento_cents BIGINT NOT NULL DEFAULT 0,
    UNIQUE(wedding_id, categoria)
  );

  CREATE TABLE IF NOT EXISTS fornecedores (
    id TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL DEFAULT '',
    telefone TEXT NOT NULL DEFAULT '',
    whatsapp TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    instagram TEXT NOT NULL DEFAULT '',
    observacoes TEXT NOT NULL DEFAULT '',
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS despesas (
    id TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    fornecedor_id TEXT REFERENCES fornecedores(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'Outros',
    descricao TEXT NOT NULL DEFAULT '',
    data_contratacao TEXT NOT NULL,
    valor_total_cents BIGINT NOT NULL,
    tipo_pagamento TEXT NOT NULL, -- avista | parcelado | entrada_parcelas | recorrente | a_combinar
    num_parcelas INTEGER NOT NULL DEFAULT 1,
    valor_entrada_cents BIGINT NOT NULL DEFAULT 0,
    periodicidade TEXT NOT NULL DEFAULT 'mensal', -- mensal | quinzenal | semanal | personalizada
    intervalo_dias INTEGER NOT NULL DEFAULT 30,
    cartao TEXT NOT NULL DEFAULT '',
    data_primeira_fatura TEXT,
    observacoes TEXT NOT NULL DEFAULT '',
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS parcelas (
    id TEXT PRIMARY KEY,
    despesa_id TEXT NOT NULL REFERENCES despesas(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    valor_cents BIGINT NOT NULL,
    vencimento TEXT NOT NULL,
    forma_pagamento TEXT NOT NULL DEFAULT '',
    observacao TEXT NOT NULL DEFAULT '',
    cancelada INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS pagamentos (
    id TEXT PRIMARY KEY,
    parcela_id TEXT NOT NULL REFERENCES parcelas(id) ON DELETE CASCADE,
    valor_pago_cents BIGINT NOT NULL,
    data_pagamento TEXT NOT NULL,
    forma_pagamento TEXT NOT NULL,
    conta_cartao TEXT NOT NULL DEFAULT '',
    observacao TEXT NOT NULL DEFAULT '',
    comprovante_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS checklist (
    id TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    prazo TEXT,
    responsavel TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente | em_andamento | concluido
    observacao TEXT NOT NULL DEFAULT '',
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS historico (
    id TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- created | updated | paid | cancelled | deleted
    entidade TEXT NOT NULL, -- despesa | parcela | fornecedor | pagamento | checklist | orcamento
    entidade_id TEXT NOT NULL DEFAULT '',
    descricao TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_despesas_wedding ON despesas(wedding_id);
  CREATE INDEX IF NOT EXISTS idx_parcelas_despesa ON parcelas(despesa_id);
  CREATE INDEX IF NOT EXISTS idx_pagamentos_parcela ON pagamentos(parcela_id);
  CREATE INDEX IF NOT EXISTS idx_fornecedores_wedding ON fornecedores(wedding_id);
  CREATE INDEX IF NOT EXISTS idx_checklist_wedding ON checklist(wedding_id);
  CREATE INDEX IF NOT EXISTS idx_historico_wedding ON historico(wedding_id);
  `);
}

export async function logHistorico(
  weddingId: string,
  tipo: string,
  entidade: string,
  entidadeId: string,
  descricao: string
) {
  const db = await getDb();
  await db.query(
    `INSERT INTO historico (id, wedding_id, tipo, entidade, entidade_id, descricao) VALUES ($1,$2,$3,$4,$5,$6)`,
    [crypto.randomUUID(), weddingId, tipo, entidade, entidadeId, descricao]
  );
}

/** Small helper so call sites read like the old synchronous prepare/run/get/all API. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = await getDb();
  const res = await db.query<T>(sql, params);
  return res.rows;
}
