import { AlertTriangle } from "lucide-react";

// Caixa de ação destrutiva isolada — texto avisa, borda vermelha,
// sempre no rodapé do form de edição (nunca no header). Segue padrão
// de "Danger zone" do GitHub e Stripe.
export function DangerZone({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label="Zona de perigo"
      className="rounded-lg border border-destructive/40 bg-destructive/5 p-5"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
          aria-hidden
        />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-destructive">
            Zona de perigo
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-start justify-between gap-3 border-t border-destructive/20 pt-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium">{title}</p>
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    </section>
  );
}
