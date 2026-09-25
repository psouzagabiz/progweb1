import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { getDb } from "../lib/db";
import { generateInstallments } from "../lib/finance/installments";

function run() {
  const db = getDb();

  const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get("joao.maria@exemplo.com") as
    | { id: string }
    | undefined;

  if (existingUser) {
    console.log("Dados de demonstração já existem. Nada a fazer.");
    console.log("Login: joao.maria@exemplo.com / senha: casamento123");
    return;
  }

  const userId = randomUUID();
  const passwordHash = bcrypt.hashSync("casamento123", 10);
  db.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?,?,?,?)").run(
    userId,
    "João e Maria",
    "joao.maria@exemplo.com",
    passwordHash
  );

  const weddingId = randomUUID();
  db.prepare(
    `INSERT INTO weddings (id, user_id, noivo1, noivo2, data_casamento, orcamento_maximo_cents, observacoes, is_demo)
     VALUES (?,?,?,?,?,?,?,1)`
  ).run(weddingId, userId, "João", "Maria", "2027-05-15", 8_000_000, "Casamento de demonstração para testar o sistema.");

  function addFornecedor(nome: string, categoria: string) {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO fornecedores (id, wedding_id, nome, categoria, telefone, whatsapp, email, instagram, observacoes, is_demo)
       VALUES (?,?,?,?,?,?,?,?,?,1)`
    ).run(id, weddingId, nome, categoria, "(11) 99999-0000", "(11) 99999-0000", "contato@exemplo.com", "@" + nome.toLowerCase().replace(/\s+/g, ""), "");
    return id;
  }

  function addDespesaComParcelas(params: {
    nome: string;
    categoria: string;
    fornecedorId: string;
    dataContratacao: string;
    valorTotalCents: number;
    valorEntradaCents: number;
    numParcelas: number;
  }) {
    const despesaId = randomUUID();
    const tipoPagamento = params.valorEntradaCents > 0 ? "entrada_parcelas" : "parcelado";
    db.prepare(
      `INSERT INTO despesas (id, wedding_id, fornecedor_id, nome, categoria, descricao, data_contratacao,
        valor_total_cents, tipo_pagamento, num_parcelas, valor_entrada_cents, periodicidade, intervalo_dias,
        cartao, data_primeira_fatura, observacoes, is_demo)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`
    ).run(
      despesaId,
      weddingId,
      params.fornecedorId,
      params.nome,
      params.categoria,
      "Despesa de demonstração",
      params.dataContratacao,
      params.valorTotalCents,
      tipoPagamento,
      params.numParcelas,
      params.valorEntradaCents,
      "mensal",
      30,
      "",
      null,
      ""
    );

    const parcelas = generateInstallments({
      valorTotalCents: params.valorTotalCents,
      valorEntradaCents: params.valorEntradaCents,
      numParcelas: params.numParcelas,
      dataContratacao: params.dataContratacao,
      periodicidade: "mensal",
      intervaloDias: 30,
    });

    const insert = db.prepare(
      `INSERT INTO parcelas (id, despesa_id, numero, label, valor_cents, vencimento) VALUES (?,?,?,?,?,?)`
    );
    for (const p of parcelas) {
      insert.run(randomUUID(), despesaId, p.numero, p.label, p.valorCents, p.vencimento);
    }
    return despesaId;
  }

  const buffet = addFornecedor("Buffet Sabor & Festa", "Buffet");
  addDespesaComParcelas({
    nome: "Buffet Sabor & Festa",
    categoria: "Buffet",
    fornecedorId: buffet,
    dataContratacao: "2026-08-01",
    valorTotalCents: 1_800_000,
    valorEntradaCents: 300_000,
    numParcelas: 10,
  });

  const foto = addFornecedor("Estúdio Lumen Fotografia", "Fotografia");
  addDespesaComParcelas({
    nome: "Fotografia",
    categoria: "Fotografia",
    fornecedorId: foto,
    dataContratacao: "2026-09-01",
    valorTotalCents: 600_000,
    valorEntradaCents: 0,
    numParcelas: 6,
  });

  const decor = addFornecedor("Flor & Cia Decorações", "Decoração");
  addDespesaComParcelas({
    nome: "Decoração",
    categoria: "Decoração",
    fornecedorId: decor,
    dataContratacao: "2026-10-01",
    valorTotalCents: 1_200_000,
    valorEntradaCents: 200_000,
    numParcelas: 5,
  });

  // Register a couple of demo payments so statuses aren't all "pendente"
  const primeiraParcelaBuffet = db
    .prepare(
      `SELECT p.id, p.valor_cents FROM parcelas p JOIN despesas d ON d.id = p.despesa_id
       WHERE d.wedding_id = ? AND d.nome = 'Buffet Sabor & Festa' ORDER BY p.numero ASC LIMIT 1`
    )
    .get(weddingId) as { id: string; valor_cents: number };
  db.prepare(
    `INSERT INTO pagamentos (id, parcela_id, valor_pago_cents, data_pagamento, forma_pagamento, conta_cartao, observacao)
     VALUES (?,?,?,?,?,?,?)`
  ).run(randomUUID(), primeiraParcelaBuffet.id, primeiraParcelaBuffet.valor_cents, "2026-08-01", "PIX", "Conta corrente", "Pagamento da entrada");

  // Checklist demo items
  const checklistItems = [
    { nome: "Fechar contrato do buffet", prazo: "2026-08-15", responsavel: "Maria", status: "concluido" },
    { nome: "Pagar entrada da decoração", prazo: "2026-10-05", responsavel: "João", status: "pendente" },
    { nome: "Revisar orçamento geral", prazo: "2027-01-15", responsavel: "João e Maria", status: "pendente" },
  ];
  for (const c of checklistItems) {
    db.prepare(
      `INSERT INTO checklist (id, wedding_id, nome, prazo, responsavel, status, observacao, is_demo) VALUES (?,?,?,?,?,?,?,1)`
    ).run(randomUUID(), weddingId, c.nome, c.prazo, c.responsavel, c.status, "");
  }

  db.prepare(
    `INSERT INTO historico (id, wedding_id, tipo, entidade, entidade_id, descricao) VALUES (?,?,?,?,?,?)`
  ).run(randomUUID(), weddingId, "created", "orcamento", weddingId, "Dados de demonstração criados durante o seed inicial");

  console.log("Seed concluído!");
  console.log("Login de demonstração: joao.maria@exemplo.com / senha: casamento123");
}

run();
