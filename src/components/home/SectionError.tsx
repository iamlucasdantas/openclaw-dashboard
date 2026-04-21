import { AlertCircle } from "lucide-react";
import { copy } from "@/lib/copy";

export function SectionError({ title }: { title?: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-dashed bg-card p-5 text-sm text-muted-foreground"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          {title ? <p className="font-medium text-foreground">{title}</p> : null}
          <p>{copy.errors.generic.body}</p>
        </div>
      </div>
    </div>
  );
}
