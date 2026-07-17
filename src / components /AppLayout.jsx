import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Store,
  PackageCheck,
  Bike,
  Wallet,
  Truck,
  MapPin,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/kitchen";

const NAV_BY_ROLE = {
  customer: [
    { to: "/customer", label: "Browse Kitchens", icon: Store },
    { to: "/orders", label: "My Orders", icon: ClipboardList },
    { to: "/profile", label: "Profile", icon: UserIcon },
  ],
  kitchen_owner: [
    { to: "/kitchen", label: "Dashboard", icon: LayoutDashboard },
    { to: "/kitchen/orders", label: "Orders", icon: ClipboardList },
    { to: "/kitchen/menu", label: "Menu", icon: UtensilsCrossed },
    { to: "/profile", label: "Profile", icon: UserIcon },
  ],
  rider: [
    { to: "/rider", label: "Available Deliveries", icon: Bike },
    { to: "/rider/deliveries", label: "My Deliveries", icon: Truck },
    { to: "/profile", label: "Profile", icon: UserIcon },
  ],
};

const ROLE_LABEL = {
  customer: "Customer",
  kitchen_owner: "Kitchen Owner",
  rider: "Rider",
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || "customer";
  const nav = NAV_BY_ROLE[role] || [];
  const showWallet = role === "customer";

  const handleLogout = async () => {
    await base44.auth.logout();
    logout(false);
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex items-center gap-2 border-b px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold leading-tight">Cloud Kitchen</p>
            <p className="text-[11px] text-muted-foreground">{ROLE_LABEL[role]} space</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t p-3">
          {showWallet && (
            <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
                <Wallet className="h-3.5 w-3.5" /> Demo wallet
              </p>
              <p className="text-lg font-semibold text-amber-900">{formatMoney(user?.wallet_balance)}</p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-card/80 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            <span className="font-heading text-sm font-semibold">Cloud Kitchen</span>
          </div>
          {showWallet && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
              <Wallet className="h-4 w-4" /> {formatMoney(user?.wallet_balance)}
            </span>
          )}
        </header>

        {/* Mobile bottom nav */}
        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t bg-card md:hidden">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {item.label.split(" ")[0]}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
