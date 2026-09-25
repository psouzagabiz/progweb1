import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const dbPath = path.join(dataDir, "app.db");

declare global {
  // eslint-disable-next-line no-var
  var __wfDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (!global.__wfDb) {
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    migrate(db);
    global.__wfDb = db;
  }
  return global.__wfDb;
}

function migrate(db: Database.Database) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS weddings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    noivo1 TEXT NOT NULL DEFAULT '',
    noivo2 TEXT NOT NULL DEFAULT '',
    data_casamento TEXT,
    orcamento_maximo_cents INTEGER NOT NULL DEFAULT 0,
    observacoes TEXT NOT NULL DEFAULT '',
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categoria_orcamentos (
    id TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    categoria TEXT NOT NULL,
    orcamento_cents INTEGER NOT NULL DEFAULT 0,
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
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS despesas (
    id TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    fornecedor_id TEXT REFERENCES fornecedores(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'Outros',
    descricao TEXT NOT NULL DEFAULT '',
    data_contratacao TEXT NOT NULL,
    valor_total_cents INTEGER NOT NULL,
    tipo_pagamento TEXT NOT NULL, -- avista | parcelado | entrada_parcelas | recorrente | a_combinar
    num_parcelas INTEGER NOT NULL DEFAULT 1,
    valor_entrada_cents INTEGER NOT NULL DEFAULT 0,
    periodicidade TEXT NOT NULL DEFAULT 'mensal', -- mensal | quinzenal | semanal | personalizada
    intervalo_dias INTEGER NOT NULL DEFAULT 30,
    cartao TEXT NOT NULL DEFAULT '',
    data_primeira_fatura TEXT,
    observacoes TEXT NOT NULL DEFAULT '',
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS parcelas (
    id TEXT PRIMARY KEY,
    despesa_id TEXT NOT NULL REFERENCES despesas(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    valor_cents INTEGER NOT NULL,
    vencimento TEXT NOT NULL,
    forma_pagamento TEXT NOT NULL DEFAULT '',
    observacao TEXT NOT NULL DEFAULT '',
    cancelada INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pagamentos (
    id TEXT PRIMARY KEY,
    parcela_id TEXT NOT NULL REFERENCES parcelas(id) ON DELETE CASCADE,
    valor_pago_cents INTEGER NOT NULL,
    data_pagamento TEXT NOT NULL,
    forma_pagamento TEXT NOT NULL,
    conta_cartao TEXT NOT NULL DEFAULT '',
    observacao TEXT NOT NULL DEFAULT '',
    comprovante_path TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS historico (
    id TEXT PRIMARY KEY,
    wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- created | updated | paid | cancelled | deleted
    entidade TEXT NOT NULL, -- despesa | parcela | fornecedor | pagamento | checklist | orcamento
    entidade_id TEXT NOT NULL DEFAULT '',
    descricao TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_despesas_wedding ON despesas(wedding_id);
  CREATE INDEX IF NOT EXISTS idx_parcelas_despesa ON parcelas(despesa_id);
  CREATE INDEX IF NOT EXISTS idx_pagamentos_parcela ON pagamentos(parcela_id);
  CREATE INDEX IF NOT EXISTS idx_fornecedores_wedding ON fornecedores(wedding_id);
  CREATE INDEX IF NOT EXISTS idx_checklist_wedding ON checklist(wedding_id);
  CREATE INDEX IF NOT EXISTS idx_historico_wedding ON historico(wedding_id);
  `);
}

export function logHistorico(
  weddingId: string,
  tipo: string,
  entidade: string,
  entidadeId: string,
  descricao: string
) {
  const db = getDb();
  db.prepare(
    `INSERT INTO historico (id, wedding_id, tipo, entidade, entidade_id, descricao) VALUES (?,?,?,?,?,?)`
  ).run(crypto.randomUUID(), weddingId, tipo, entidade, entidadeId, descricao);
}
