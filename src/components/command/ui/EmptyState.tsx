"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
  size?: "sm" | "md";
}

export function EmptyState({ icon: Icon, title, description, action, size = "md" }: EmptyStateProps) {
  const isSmall = size === "sm";
  return (
    <div className={`flex flex-col items-center justify-center text-center ${isSmall ? "py-8 px-4" : "py-16 px-6"}`}>
      <div className={`mb-4 flex items-center justify-center rounded-2xl bg-ink/[0.04] ${isSmall ? "h-12 w-12" : "h-16 w-16"}`}>
        <Icon className={`text-ink/25 ${isSmall ? "h-6 w-6" : "h-8 w-8"}`} />
      </div>
      <h3 className={`mb-2 font-semibold text-ink ${isSmall ? "text-sm" : "text-base"}`}>{title}</h3>
      <p className={`mb-6 max-w-sm text-slate leading-relaxed ${isSmall ? "text-xs" : "text-sm"}`}>{description}</p>
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
