"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, Trash2, FileDown } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function ConfiguracoesClient({ hasDemoData }: { hasDemoData: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmRemoveDemo, setConfirmRemoveDemo] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (res.ok) {
        setMessage("Backup restaurado com sucesso.");
        router.refresh();
      } else {
        setMessage("Erro ao restaurar backup.");
      }
    } catch {
      setMessage("Arquivo inválido.");
    }
    setRestoring(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleRemoveDemo() {
    await fetch("/api/demo/remove", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-5">
        <h2 className="font-medium mb-2">Backup completo</h2>
        <p className="text-sm text-muted mb-4">Exporte todos os seus dados (orçamento, despesas, parcelas, pagamentos, fornecedores, checklist) como um arquivo JSON, ou restaure a partir de um backup anterior.</p>
        <div className="flex flex-wrap gap-3">
          <a href="/api/backup" className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar backup (JSON)
          </a>
          <button onClick={() => fileRef.current?.click()} disabled={restoring} className="btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" /> {restoring ? "Restaurando..." : "Restaurar backup"}
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleRestore} />
        </div>
        {message && <p className="text-sm mt-3 text-accent-dark">{message}</p>}
      </div>

      <div className="card p-5">
        <h2 className="font-medium mb-2">Exportação em CSV</h2>
        <p className="text-sm text-muted mb-4">Exporte listas específicas em CSV para abrir em planilhas.</p>
        <div className="flex flex-wrap gap-3">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/export/pagamentos" className="btn-secondary flex items-center gap-2">
            <FileDown className="w-4 h-4" /> Pagamentos
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/export/parcelas" className="btn-secondary flex items-center gap-2">
            <FileDown className="w-4 h-4" /> Parcelas
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/export/fornecedores" className="btn-secondary flex items-center gap-2">
            <FileDown className="w-4 h-4" /> Fornecedores
          </a>
        </div>
        <p className="text-xs text-muted mt-3">Exportação em PDF e Excel: em breve (não implementado nesta versão).</p>
      </div>

      {hasDemoData && (
        <div className="card p-5 border-l-4 border-l-warning">
          <h2 className="font-medium mb-2">Dados de demonstração</h2>
          <p className="text-sm text-muted mb-4">
            Sua conta contém dados de exemplo (fornecedores e despesas demonstrativos) criados para você experimentar o sistema. Você pode removê-los quando estiver pronto para usar seus próprios dados.
          </p>
          <button onClick={() => setConfirmRemoveDemo(true)} className="btn-secondary flex items-center gap-2 text-danger">
            <Trash2 className="w-4 h-4" /> Remover dados de demonstração
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmRemoveDemo}
        onClose={() => setConfirmRemoveDemo(false)}
        onConfirm={handleRemoveDemo}
        title="Remover dados de demonstração"
        confirmLabel="Remover"
        message="Isso removerá permanentemente todas as despesas, fornecedores e tarefas de demonstração (e suas parcelas/pagamentos vinculados). Seus dados reais não serão afetados."
      />
    </div>
  );
}
