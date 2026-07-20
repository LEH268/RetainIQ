import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, LogOut, Sparkles, BarChart2, Layers, Settings, Megaphone } from "lucide-react";

const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/customers", label: "Customers", icon: Users },
    { to: "/segmentation", label: "Segmentation", icon: Layers },
    { to: "/analytics", label: "Analytics & Reports", icon: BarChart2 },
    { to: "/campaigns", label: "Campaigns", icon: Megaphone },
    { to: "/settings", label: "Settings", icon: Settings }
];

export default function Sidebar({ onLogout }) {
    return (
        <aside className="flex h-screen w-64 flex-col justify-between bg-[var(--color-ink)] text-white/90 px-4 py-8 shadow-2xl relative overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[var(--color-brand)]/20 to-[var(--color-accent)]/20 blur-2xl z-0 pointer-events-none"></div>
            
            <div className="z-10 relative">
                <div className="mb-8 px-3 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-accent)] rounded-lg shadow-lg">
                        <Sparkles className="text-white" size={20} />
                    </div>
                    <span className="font-display text-2xl font-bold tracking-tight text-white">RetainIQ</span>
                </div>
                <nav className="flex flex-col gap-1.5">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive ? "bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-dark)] text-white shadow-md border border-[var(--color-brand)]/50" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
                            <Icon size={18} /> {label}
                        </NavLink>
                    ))}
                </nav>
            </div>
            
            <button onClick={onLogout} className="z-10 relative flex items-center gap-3 mt-8 rounded-xl px-4 py-3 text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-all">
                <LogOut size={18} /> Log out
            </button>
        </aside>
    );
}