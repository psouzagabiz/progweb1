import { redirect } from "next/navigation";
import { requireUserAndWedding } from "@/lib/auth/session";
import { listHistorico } from "@/lib/db/repo";

export default async function HistoricoPage() {
  const ctx = await requireUserAndWedding();
  if (!ctx) redirect("/login");
  const historico = listHistorico(ctx.wedding.id, 200);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Histórico</h1>
        <p className="text-muted text-sm mt-1">Registro de todas as alterações realizadas.</p>
      </div>
      <div className="card divide-y divide-border">
        {historico.map((h) => (
          <div key={h.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
            <div>
              <p>{h.descricao}</p>
              <p className="text-xs text-muted capitalize">{h.tipo} · {h.entidade}</p>
            </div>
            <span className="text-xs text-muted shrink-0">{new Date(h.created_at).toLocaleString("pt-BR")}</span>
          </div>
        ))}
        {historico.length === 0 && <p className="text-center text-muted py-8">Nenhum evento registrado ainda.</p>}
      </div>
    </div>
  );
}
