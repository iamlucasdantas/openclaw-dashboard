import Link from "next/link";
import { Bot } from "lucide-react";
import { copy } from "@/lib/copy";

export function EmptyFirstAssistant() {
  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center sm:p-12">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Bot className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {copy.empty.home.firstAssistant.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        {copy.empty.home.firstAssistant.body}
      </p>
      <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <Link
          href="/client/agents/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copy.empty.home.firstAssistant.cta}
        </Link>
        <span className="text-xs text-muted-foreground">ou</span>
        <Link
          href="/client/agents/new"
          className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Começar a partir de um modelo
        </Link>
      </div>
    </section>
  );
}
