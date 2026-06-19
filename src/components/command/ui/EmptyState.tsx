"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink/[0.04]">
        <Icon className="h-8 w-8 text-ink/30" />
      </div>
      <h3 className="mb-2 text-base font-semibold text-ink">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-slate leading-relaxed">{description}</p>
      {action && (
        action.href
          ? (
            <Link href={action.href}>
              <Button variant="outline" size="sm">{action.label}</Button>
            </Link>
          )
          : (
            <Button variant="outline" size="sm" onClick={action.onClick}>{action.label}</Button>
          )
      )}
    </div>
  );
}
