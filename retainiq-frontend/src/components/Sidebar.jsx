import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, LogOut } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
];

export default function Sidebar({ onLogout }) {
  return (
    <aside className="flex h-screen w-60 flex-col justify-between bg-[var(--color-ink)] text-white/90 px-4 py-6">
      <div>
        <div className="mb-8 px-2">
          <span className="font-display text-lg font-semibold tracking-tight text-white">RetainIQ</span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
      >
        <LogOut size={17} />
        Log out
      </button>
    </aside>
  );
}
