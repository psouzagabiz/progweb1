import AppShell from "@/components/layout/AppShell";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell userName="Convidado">{children}</AppShell>;
}
