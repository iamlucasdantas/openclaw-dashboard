import { redirect } from "next/navigation";

// Rota alternativa: /admin/schedules → /admin/crons. Usuários compartilham
// URLs de "Agendamentos" e esperam que /admin/schedules funcione (era 404).
export default function AdminSchedulesRedirect() {
  redirect("/admin/crons");
}
