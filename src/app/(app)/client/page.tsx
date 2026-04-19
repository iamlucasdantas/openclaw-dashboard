import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  budgetSnapshot,
  computeHeadline,
  myAssistantsSummary,
  nextTask,
  todayDigest,
} from "@/lib/home-queries";
import { HomeGreeting } from "@/components/home/HomeGreeting";
import { TodayDigest } from "@/components/home/TodayDigest";
import { UpcomingTaskCard } from "@/components/home/UpcomingTaskCard";
import { BudgetSnapshotCard } from "@/components/home/BudgetSnapshot";
import { MyAssistantsGrid } from "@/components/home/MyAssistantsGrid";
import { EmptyFirstAssistant } from "@/components/home/EmptyFirstAssistant";

export default async function ClientHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tenantIds = session.user.tenantIds ?? [];
  const isAdminInClientView = session.user.isAdmin;
  const firstName = (session.user.name ?? "").split(" ")[0] || "por aí";

  // Sem tenants: hero de onboarding puro
  if (tenantIds.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyFirstAssistant />
      </div>
    );
  }

  // Todas as queries em paralelo
  const [today, upcoming, budget, assistants] = await Promise.all([
    todayDigest(tenantIds),
    nextTask(tenantIds),
    budgetSnapshot(tenantIds),
    myAssistantsSummary(tenantIds),
  ]);

  // Se não tem nenhum assistente sob este user, mesmo hero de onboarding
  if (assistants.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyFirstAssistant />
      </div>
    );
  }

  const headline = computeHeadline(assistants);

  return (
    <div className="space-y-6">
      <HomeGreeting
        name={firstName}
        headline={headline}
        isAdminInClientView={isAdminInClientView}
      />

      <TodayDigest entries={today} />

      <div className="grid gap-4 lg:grid-cols-2">
        <UpcomingTaskCard next={upcoming} />
        <BudgetSnapshotCard snapshot={budget} />
      </div>

      <MyAssistantsGrid items={assistants} />
    </div>
  );
}
