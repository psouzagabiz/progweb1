import { redirect } from "next/navigation";
import { requireUserAndWedding } from "@/lib/auth/session";
import { listChecklist } from "@/lib/db/repo";
import ChecklistClient from "@/components/checklist/ChecklistClient";

export default async function ChecklistPage() {
  const ctx = await requireUserAndWedding();
  if (!ctx) redirect("/login");
  const items = listChecklist(ctx.wedding.id).map((c) => ({
    id: c.id,
    nome: c.nome,
    prazo: c.prazo,
    responsavel: c.responsavel,
    status: c.status,
    observacao: c.observacao,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Checklist</h1>
        <p className="text-muted text-sm mt-1">Tarefas financeiras do casamento.</p>
      </div>
      <ChecklistClient items={items} />
    </div>
  );
}
