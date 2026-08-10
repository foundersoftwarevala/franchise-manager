import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  Bell,
  FileSignature,
  Gauge,
  Receipt,
  ShieldAlert,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  ChevronDown,
  ClipboardList,
  Coins,
  FileText,
  Gavel,
  Globe2,
  LayoutDashboard,
  LifeBuoy,
  Map,
  Megaphone,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

const COLLAPSE_KEY = "sv:sidebar:collapsed";

export type NavItem = { to: string; label: string; icon: LucideIcon };

const PRIMARY: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Franchise",
    items: [
      { to: "/applications", label: "Applications", icon: ClipboardList },
      { to: "/directory", label: "Franchise Directory", icon: Building2 },
      { to: "/leads", label: "Leads", icon: Briefcase },
      { to: "/onboarding", label: "Onboarding", icon: Rocket },
    ],
  },
  {
    label: "Territory",
    items: [
      { to: "/countries", label: "Countries", icon: Globe2 },
      { to: "/regions", label: "Regions", icon: Map },
    ],
  },
  {
    label: "Commercial",
    items: [
      { to: "/revenue", label: "Revenue", icon: Wallet },
      { to: "/commission", label: "Commission", icon: Coins },
      { to: "/royalties", label: "Royalties", icon: Receipt },
      { to: "/contracts", label: "Contracts", icon: FileSignature },
      { to: "/products", label: "Products", icon: Package },
      { to: "/license", label: "License", icon: Award },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/performance", label: "Performance", icon: Gauge },
      { to: "/users", label: "Users", icon: Users },
      { to: "/support", label: "Support", icon: LifeBuoy },
      { to: "/escalations", label: "Escalations", icon: AlertTriangle },
      { to: "/training", label: "Training", icon: BookOpen },
      { to: "/compliance", label: "Compliance", icon: ShieldCheck },
      { to: "/fraud", label: "Fraud & Risk", icon: ShieldAlert },
      { to: "/legal", label: "Legal", icon: Gavel },
    ],
  },
  {
    label: "Growth",
    items: [
      { to: "/marketing", label: "Marketing", icon: Megaphone },
      { to: "/documents", label: "Documents", icon: FileText },
      { to: "/communication", label: "Communication", icon: MessageSquare },
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/reports", label: "Reports", icon: FileText },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });

  return { collapsed, toggleCollapsed, mobileOpen, setMobileOpen };
}

export function AppSidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onCloseMobile]);

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const groupOpen = (label: string, items: NavItem[]) =>
    openGroups[label] ?? items.some((i) => isActive(i.to));

  const onNavKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const nav = e.currentTarget.closest("nav");
    if (!nav) return;
    const items = Array.from(
      nav.querySelectorAll<HTMLElement>('a[href], button[data-nav-group="true"]'),
    ).filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;
    e.preventDefault();
    const current = items.indexOf(e.target as HTMLElement);
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? items.length - 1
          : e.key === "ArrowDown"
            ? (current + 1 + items.length) % items.length
            : (current - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  const ItemLink = ({ item }: { item: NavItem }) => (
    <Link
      to={item.to}
      onClick={onCloseMobile}
      onKeyDown={onNavKeyDown}
      title={item.label}
      aria-current={isActive(item.to) ? "page" : undefined}
      className={`group/item relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)] ${
        collapsed ? "justify-center px-0" : ""
      } ${
        isActive(item.to)
          ? "bg-primary/18 font-medium text-foreground"
          : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
      }`}
    >
      {isActive(item.to) && (
        <span className="absolute bottom-1.5 left-0 top-1.5 w-[2px] rounded-full bg-primary" />
      )}
      <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && <span className="sr-only">{item.label}</span>}
    </Link>
  );


  const content = (
    <div className="flex h-full flex-col">
      <div
        className={`flex h-16 shrink-0 items-center gap-2 border-b border-border px-3 ${
          collapsed ? "justify-center px-0" : ""
        }`}
      >
        <Link to="/dashboard" className="flex min-w-0 items-center gap-2" onClick={onCloseMobile}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow font-bold text-primary-foreground">
            SV
          </span>
          {!collapsed && <span className="truncate text-sm font-semibold tracking-tight">Software Vala</span>}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggleCollapsed}
            className="ml-auto hidden h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground lg:grid"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onCloseMobile}
          className="ml-auto grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {collapsed && (
        <button
          onClick={onToggleCollapsed}
          className="mx-auto mt-3 hidden h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground lg:grid"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {!collapsed && (
        <div className="shrink-0 px-3 pt-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a module…"
              aria-label="Find a module"
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      <nav
        className="flex-1 space-y-3 overflow-y-auto px-2 py-3"
        aria-label="Franchise manager modules"
      >
        <div className="space-y-0.5">
          {PRIMARY.map((item) => (
            <ItemLink key={item.to} item={item} />
          ))}
        </div>

        {(filtered ?? GROUPS).map((group) => {
          const open = filtered ? true : groupOpen(group.label, group.items);
          if (collapsed) {
            return (
              <div key={group.label} className="space-y-0.5 border-t border-border/60 pt-2">
                {group.items.map((item) => (
                  <ItemLink key={item.to} item={item} />
                ))}
              </div>
            );
          }
          return (
            <div key={group.label}>
              <button
                data-nav-group="true"
                onClick={() => setOpenGroups((s) => ({ ...s, [group.label]: !open }))}
                onKeyDown={onNavKeyDown}
                aria-expanded={open}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)]"
              >
                {group.label}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
              </button>
              <div
                className={`grid transition-all duration-200 ease-out ${
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="mt-0.5 space-y-0.5">
                    {group.items.map((item) => (
                      <ItemLink key={item.to} item={item} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

    </div>
  );

  return (
    <>
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-background/80 backdrop-blur-xl transition-[width] duration-300 ease-out motion-reduce:transition-none lg:flex ${
          collapsed ? "w-[72px]" : "w-[264px]"
        }`}
      >
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-label="Close menu overlay"
          />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-border bg-background shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
