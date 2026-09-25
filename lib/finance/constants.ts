export const CATEGORIAS_DESPESA = [
  "Buffet",
  "Fotografia",
  "Decoração",
  "Local/Espaço",
  "Vestido/Traje",
  "Música/DJ",
  "Convites",
  "Lembrancinhas",
  "Beleza",
  "Doces/Bolo",
  "Cerimônia",
  "Transporte",
  "Lua de mel",
  "Joias/Alianças",
  "Papelaria",
  "Outros",
];

export const FORMAS_PAGAMENTO = [
  "PIX",
  "Dinheiro",
  "Débito",
  "Crédito",
  "Transferência",
  "Boleto",
  "Outro",
];

export const TIPOS_PAGAMENTO = [
  { value: "avista", label: "À vista" },
  { value: "parcelado", label: "Parcelado" },
  { value: "entrada_parcelas", label: "Entrada + parcelas" },
  { value: "recorrente", label: "Recorrente" },
  { value: "a_combinar", label: "A combinar" },
] as const;

export const PERIODICIDADES = [
  { value: "mensal", label: "Mensal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "semanal", label: "Semanal" },
  { value: "personalizada", label: "Personalizada" },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  vencido: "Vencido",
  parcial: "Parcialmente pago",
  cancelado: "Cancelado",
};

export const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800 border-amber-200",
  pago: "bg-emerald-100 text-emerald-800 border-emerald-200",
  vencido: "bg-red-100 text-red-800 border-red-200",
  parcial: "bg-blue-100 text-blue-800 border-blue-200",
  cancelado: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export const CHECKLIST_STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};
