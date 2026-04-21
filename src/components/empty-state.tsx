import Link from "next/link";
import { Button } from "@/components/form";

export function EmptyState({
  icon,
  title,
  description,
  action,
  colSpan,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  colSpan?: number;
}) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
      {icon ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link href={action.href}>
          <Button>{action.label}</Button>
        </Link>
      ) : null}
    </div>
  );

  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan}>{content}</td>
      </tr>
    );
  }
  return content;
}
