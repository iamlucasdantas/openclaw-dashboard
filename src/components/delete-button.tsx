"use client";

import { Trash2 } from "lucide-react";
import { Button } from "./form";

export function DeleteButton({
  message,
  label = "Excluir",
  icon = true,
}: {
  message: string;
  label?: string;
  icon?: boolean;
}) {
  return (
    <Button
      type="submit"
      variant="destructive"
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {icon ? <Trash2 className="h-4 w-4" /> : null}
      {label}
    </Button>
  );
}
