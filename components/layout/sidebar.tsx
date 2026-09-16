"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UsersRound, Upload, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/creators",
    label: "Creators",
    icon: UsersRound,
    matches: ["/creators", "/accounts"],
  },
  { href: "/import", label: "Import", icon: Upload, matches: ["/import"] },
  {
    href: "/link-tracking",
    label: "Link-Tracking",
    icon: Link2,
    matches: ["/link-tracking"],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 px-6">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          Analytics
        </span>
      </div>
      <nav className="flex flex-col gap-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive = item.matches.some((m) => pathname.startsWith(m));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
