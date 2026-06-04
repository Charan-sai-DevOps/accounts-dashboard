import { useState } from "react";
import {
  LayoutDashboard,
  CreditCard,
  BarChart2,
  Bell,
  Settings,
  ChevronRight,
  Zap,
  LogOut,
  User,
  BellRing,
  ShieldCheck,
  X,
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
  onNavigateToProfile?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToNotifications?: () => void;
  onLogout?: () => void;
  profile?: {
    username: string;
    email: string;
  };
  isOpen?: boolean;
  onClose?: () => void;
  currentUserRole?: "Admin" | "Member" | "Viewer";
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
  onNavigateToProfile,
  onNavigateToSettings,
  onNavigateToNotifications,
  onLogout,
  profile,
  isOpen = false,
  onClose,
  currentUserRole = "Admin",
}: SidebarProps) {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const username = profile?.username || profile?.email?.split("@")[0] || "";
  const email = profile?.email || "";
  const initialLetter = username && username.length > 0 ? username[0].toUpperCase() : "?";
  const isAdmin = currentUserRole === "Admin";
  const visibleNavItems = navItems.filter((item) => item.id !== "settings" || isAdmin);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 lg:z-auto ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      style={{
        background:
          "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)",
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center justify-between">
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
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: "#94a3b8" }}
        >
          <X size={18} />
        </button>
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
        {visibleNavItems.map((item) => {
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
      <div 
        className="px-5 py-5 border-t border-white/10 relative"
        onMouseEnter={() => setShowQuickMenu(true)}
        onMouseLeave={() => setShowQuickMenu(false)}
      >
        {showQuickMenu && (
          <div
            className="absolute bottom-16 left-5 w-64 rounded-3xl border backdrop-blur-md transition-all duration-200 overflow-hidden"
            style={{
              background: "rgba(17, 24, 39, 0.97)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
              zIndex: 50,
            }}
          >
            <div className="px-4 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {initialLetter}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{username}</p>
                  <p style={{ color: "#94a3b8", fontSize: "11px" }}>{email}</p>
                </div>
              </div>
            </div>

            <div className="px-2 py-2">
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      onNavigateToProfile?.();
                      setShowQuickMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group hover:bg-white/5"
                    style={{ color: "#e2e8f0" }}
                  >
                    <User size={16} className="text-slate-300 group-hover:text-white" />
                    <span className="text-sm font-medium">Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigateToSettings?.();
                      onNavigate("settings");
                      setShowQuickMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group hover:bg-white/5"
                    style={{ color: "#e2e8f0" }}
                  >
                    <Settings size={16} className="text-slate-300 group-hover:text-white" />
                    <span className="text-sm font-medium">Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigateToNotifications?.();
                      onNavigate("settings");
                      setShowQuickMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group hover:bg-white/5"
                    style={{ color: "#e2e8f0" }}
                  >
                    <BellRing size={16} className="text-slate-300 group-hover:text-white" />
                    <span className="text-sm font-medium">Notifications</span>
                  </button>
                </>
              )}
              <div className="my-2 h-px bg-white/10" />
              <button
                onClick={() => {
                  setShowLogoutConfirm(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group hover:bg-rose-500/10"
                style={{ color: "#fda4af" }}
              >
                <LogOut size={16} className="text-rose-300 group-hover:text-rose-200" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}

        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="w-full max-w-sm rounded-3xl overflow-hidden bg-white" style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.15)", margin: "auto" }}>
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.14)" }}>
                  <LogOut size={28} style={{ color: "#ef4444" }} />
                </div>
                <h2 style={{ color: "#0f172a", fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Log out?</h2>
                <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px", lineHeight: 1.5 }}>
                  Are you sure you want to log out of your account?
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-3 rounded-xl transition-colors"
                    style={{ border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowLogoutConfirm(false);
                      onLogout?.();
                    }}
                    className="flex-1 py-3 rounded-xl text-white transition-colors"
                    style={{ background: "#ef4444", fontWeight: 600 }}
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          onClick={isAdmin ? onNavigateToProfile : undefined}
          className={`flex items-center gap-3 transition-opacity${isAdmin ? " cursor-pointer hover:opacity-80" : ""}`}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{
              background:
                "linear-gradient(135deg, #6366f1, #8b5cf6)",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {initialLetter}
          </div>
          <div>
            <p
              style={{
                fontSize: "13px",
                color: "#e2e8f0",
                fontWeight: 500,
              }}
            >
              {username}
            </p>
            <p style={{ fontSize: "11px", color: "#64748b" }}>
              {email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
