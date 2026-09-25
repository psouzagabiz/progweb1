export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireUserAndWedding } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import ConfiguracoesClient from "@/components/configuracoes/ConfiguracoesClient";

export default async function ConfiguracoesPage() {
  const ctx = await requireUserAndWedding();
  if (!ctx) redirect("/login");
  const db = await getDb();
  const demoDespesasRes = await db.query(
    "SELECT COUNT(*) as c FROM despesas WHERE wedding_id = $1 AND is_demo = 1",
    [ctx.wedding.id]
  );
  const demoFornecedoresRes = await db.query(
    "SELECT COUNT(*) as c FROM fornecedores WHERE wedding_id = $1 AND is_demo = 1",
    [ctx.wedding.id]
  );
  const hasDemoData =
    Number(demoDespesasRes.rows[0].c) > 0 || Number(demoFornecedoresRes.rows[0].c) > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Configurações</h1>
        <p className="text-muted text-sm mt-1">Backup, exportação e gerenciamento de dados.</p>
      </div>
      <ConfiguracoesClient hasDemoData={hasDemoData} />
    </div>
  );
}
