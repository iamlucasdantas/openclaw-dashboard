import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { copy, t } from "@/lib/copy";
import type { HealthHeadline } from "@/lib/home-queries";
import Link from "next/link";

type Props = {
  name: string;
  headline: HealthHeadline;
  isAdminInClientView?: boolean;
};

function pickGreeting(now = new Date()) {
  const h = now.getHours();
  if (h >= 6 && h < 12) return copy.home.greeting.morning;
  if (h >= 12 && h < 18) return copy.home.greeting.afternoon;
  return copy.home.greeting.evening;
}

export function HomeGreeting({
  name,
  headline,
  isAdminInClientView = false,
}: Props) {
  const greeting = pickGreeting();

  const { line, Icon, tone, cta } = (() => {
    if (headline.kind === "someStopped") {
      const tpl =
        headline.count === 1
          ? copy.home.headlineSomeStopped.one
          : copy.home.headlineSomeStopped.many;
      return {
        line: t(tpl, { count: headline.count }),
        Icon: AlertCircle,
        tone: "critical" as const,
        cta: "Ver o que aconteceu",
      };
    }
    if (headline.kind === "someAttention") {
      const tpl =
        headline.count === 1
          ? copy.home.headlineSomeAttention.one
          : copy.home.headlineSomeAttention.many;
      return {
        line: t(tpl, { count: headline.count }),
        Icon: AlertTriangle,
        tone: "warn" as const,
        cta: "Revisar assistentes",
      };
    }
    const tpl =
      headline.count === 1
        ? copy.home.headlineAllWorking.one
        : copy.home.headlineAllWorking.many;
    return {
      line: t(tpl, { count: headline.count }),
      Icon: CheckCircle2,
      tone: "ok" as const,
      cta: null,
    };
  })();

  const toneCss =
    tone === "critical"
      ? "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/30 dark:text-rose-100 dark:border-rose-900"
      : tone === "warn"
        ? "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:text-amber-100 dark:border-amber-900"
        : "bg-card text-foreground border";

  return (
    <section
      role="status"
      aria-live="polite"
      className={`rounded-xl border p-5 sm:p-6 ${toneCss}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-base font-medium sm:text-lg">
            {t(greeting, { name })}
            {isAdminInClientView ? (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                {copy.home.headlineAdminBadge}
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-sm opacity-90 sm:text-base">{line}</p>
          {cta ? (
            <Link
              href="/client/agents"
              className="mt-3 inline-block text-sm font-medium underline underline-offset-4 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {cta} →
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
