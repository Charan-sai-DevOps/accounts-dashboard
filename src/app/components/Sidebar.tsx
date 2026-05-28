import {
  LayoutDashboard,
  CreditCard,
  BarChart2,
  Bell,
  Settings,
  ChevronRight,
  Zap,
} from "lucide-react";

type Page =
  | "dashboard"
  | "subscriptions"
  | "reports"
  | "renewals"
  | "settings";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: {
  id: Page;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    icon: <CreditCard size={18} />,
  },
  {
    id: "reports",
    label: "Reports",
    icon: <BarChart2 size={18} />,
  },
  {
    id: "renewals",
    label: "Renewals",
    icon: <Bell size={18} />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings size={18} />,
  },
];

export function Sidebar({
  activePage,
  onNavigate,
}: SidebarProps) {
  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)",
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, #6366f1, #8b5cf6)",
            }}
          >
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p
              className="text-white"
              style={{
                fontSize: "15px",
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Tracker
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                lineHeight: 1.2,
              }}
            >
              Subscription Manager
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
        <p
          style={{
            fontSize: "10px",
            color: "#64748b",
            letterSpacing: "0.1em",
            fontWeight: 600,
            marginBottom: "8px",
            paddingLeft: "12px",
          }}
        >
          MENU
        </p>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group"
              style={{
                background: isActive
                  ? "rgba(99, 102, 241, 0.2)"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(99, 102, 241, 0.3)"
                  : "1px solid transparent",
                color: isActive ? "#a5b4fc" : "#94a3b8",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  style={{
                    color: isActive ? "#818cf8" : "#64748b",
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {item.label}
                </span>
              </div>
              {isActive && (
                <ChevronRight
                  size={14}
                  style={{ color: "#818cf8" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-5 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{
              background:
                "linear-gradient(135deg, #6366f1, #8b5cf6)",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            C
          </div>
          <div>
            <p
              style={{
                fontSize: "13px",
                color: "#e2e8f0",
                fontWeight: 500,
              }}
            >
              Charan Sai
            </p>
            <p style={{ fontSize: "11px", color: "#64748b" }}>
              Charan@webomindapps.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}