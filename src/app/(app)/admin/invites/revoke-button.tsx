"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/form";
import { revokeInvite } from "@/app/actions/invites";

export function RevokeInviteButton({
  id,
  email,
  label = "Revogar",
}: {
  id: string;
  email: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Revogar convite para ${email}?`)) return;
        startTransition(() => {
          void revokeInvite(id);
        });
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
