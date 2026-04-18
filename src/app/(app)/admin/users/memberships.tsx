"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/form";
import { removeMembership } from "@/app/actions/users";

export function RemoveMembershipButton({
  userId,
  tenantId,
  tenantName,
}: {
  userId: string;
  tenantId: string;
  tenantName: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Remover vínculo do cliente "${tenantName}"?`)) return;
        startTransition(() => {
          void removeMembership(userId, tenantId);
        });
      }}
      className="h-8 px-2"
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  );
}
