"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  LayoutGrid,
  MessageSquare,
  BarChart2,
  ShieldAlert,
  Plug,
  Users,
  Layers,
  Settings,
  Zap,
  ChevronDown,
  Settings2,
  LogOut,
  Database,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BadgeVariant = "primary" | "destructive";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: BadgeVariant;
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Sparkles },
  { label: "My Forms", href: "/forms", icon: LayoutGrid },
  { label: "Responses", href: "/responses", icon: MessageSquare },
  { label: "Analytics", href: "/analytics", icon: BarChart2, badge: "Beta", badgeVariant: "primary" },
];

const toolsNav: NavItem[] = [
  { label: "Integrity", href: "/integrity", icon: ShieldAlert, badge: "1", badgeVariant: "destructive" },
  { label: "Data Upload", href: "/data-upload", icon: Database },
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Audience", href: "/audience", icon: Users },
  { label: "Templates", href: "/templates", icon: Layers },
];

const accountNav = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Upgrade", href: "/upgrade", icon: Zap },
];

interface SidebarProps {
  responsesThisMonth?: number;
  responsesLimit?: number;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  integrityAlerts?: number;
}

export function Sidebar({
  responsesThisMonth = 0,
  responsesLimit = 100,
  user,
  integrityAlerts = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const usagePercent = Math.min(
    100,
    Math.round((responsesThisMonth / responsesLimit) * 100)
  );

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const navItemClass = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors group",
      isActive(href)
        ? "bg-primary/15 text-primary font-medium"
        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
    );

  const navIconClass = (href: string) =>
    cn(
      "h-4 w-4 shrink-0 transition-colors",
      isActive(href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
    );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-[hsl(240,10%,5%)] border-r border-border/40 z-50">
      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border/40">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">FeedMind</span>
      </div>

      {/* ── Workspace selector ── */}
      <div className="px-3 py-3 border-b border-border/40">
        <button className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors text-left">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold shrink-0">
            {initials.charAt(0)}
          </div>
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="text-sm font-medium text-foreground truncate leading-tight">
              {user?.name?.split(" ")[0]}&apos;s Workspace
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              Free Plan · {usagePercent}% used
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {/* MAIN */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
            Main
          </p>
          <div className="space-y-0.5">
            {mainNav.map((item) => (
              <Link key={item.href} href={item.href} className={navItemClass(item.href)}>
                <item.icon className={navIconClass(item.href)} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge
                    className={cn(
                      "ml-auto text-[10px] px-1.5 py-0 h-4 border-0 font-medium",
                      item.badgeVariant === "destructive"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-primary/20 text-primary"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* TOOLS */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
            Tools
          </p>
          <div className="space-y-0.5">
            {toolsNav.map((item) => {
              const badgeCount =
                item.label === "Integrity" && integrityAlerts > 0
                  ? integrityAlerts
                  : item.badge;
              return (
                <Link key={item.href} href={item.href} className={navItemClass(item.href)}>
                  <item.icon className={navIconClass(item.href)} />
                  <span className="flex-1">{item.label}</span>
                  {badgeCount && (
                    <Badge
                      className={cn(
                        "ml-auto text-[10px] px-1.5 py-0 h-4 border-0 font-medium",
                        item.badgeVariant === "destructive"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-primary/20 text-primary"
                      )}
                    >
                      {badgeCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ACCOUNT */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
            Account
          </p>
          <div className="space-y-0.5">
            {accountNav.map((item) => (
              <Link key={item.href} href={item.href} className={navItemClass(item.href)}>
                <item.icon className={navIconClass(item.href)} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Bottom panel ── */}
      <div className="border-t border-border/40">
        {/* Responses this month */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Responses this month</span>
            <span className="text-xs text-primary font-semibold">
              {responsesThisMonth} / {responsesLimit}
            </span>
          </div>
          <Progress value={usagePercent} className="h-1.5 bg-muted/50" />
        </div>

        {/* User row */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-border/40">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
            <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight truncate">{user?.name}</p>
            <p className="text-[11px] text-muted-foreground leading-tight truncate">
              {user?.email}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <Settings2 className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 text-red-500 focus:text-red-500"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
