"use client";

import { useTransition } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/form";
import { simulateRun } from "@/app/actions/prospecting";

export function RunNowButton({ campaignId }: { campaignId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      disabled={pending}
      onClick={() => start(() => void simulateRun(campaignId))}
    >
      <Play className="h-4 w-4" aria-hidden />
      {pending ? "Buscando..." : "Rodar agora"}
    </Button>
  );
}
