"use client";

import { useTransition } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/form";
import { markLeadSynced } from "@/app/actions/prospecting";

export function SyncLeadButton({ leadId }: { leadId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={() => start(() => void markLeadSynced(leadId))}
      className="h-7 px-2 text-[11px]"
    >
      <Upload className="h-3 w-3" aria-hidden />
      {pending ? "Enviando..." : "Sincronizar"}
    </Button>
  );
}
