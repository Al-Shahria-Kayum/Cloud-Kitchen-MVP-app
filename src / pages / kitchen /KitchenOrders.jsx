import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { formatMoney } from "@/lib/kitchen";
import { format } from "date-fns";

const TABS = [
  { key: "incoming", label: "Incoming", statuses: ["pending"] },
  { key: "active", label: "Active", statuses: ["accepted", "preparing", "ready", "awaiting_rider"] },
  { key: "all", label: "All", statuses: [] },
];

export default function KitchenOrders() {
  const { user } = useAuth();
  const [kitchen, setKitchen] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("incoming");

  const load = async () => {
    const ks = await base44.entities.Kitchen.filter({ created_by_id: user.id });
    if (!ks[0]) { setLoading(false); return; }
    setKitchen(ks[0]);
    const list = await base44.entities.Order.filter({ kitchen_id: ks[0].id }, "-created_date", 200);
    setOrders(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Order.subscribe((event) => {
      if (!kitchen || event.data?.kitchen_id !== kitchen.id) return;
      if (event.type === "create") setOrders((p) => [event.data, ...p]);
      if (event.type === "update") setOrders((p) => p.map((o) => (o.id === event.data.id ? event.data : o)));
    });
    return () => unsub && unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, kitchen?.id]);

  const filtered = () => {
    const t = TABS.find((x) => x.key === tab);
    if (!t.statuses.length) return orders;
    return orders.filter((o) => t.statuses.includes(o.status));
  };

  if (loading) return <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;
  if (!kitchen) return <p className="p-6 text-center text-muted-foreground">Create your kitchen first.</p>;

  const list = filtered();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-5 font-heading text-2xl font-semibold">Orders</h1>

      <div className="mb-4 flex gap-1 rounded-xl border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">No orders here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between rounded-xl border bg-card p-3 hover:border-primary/30">
              <div>
                <p className="font-medium">{o.customer_name}</p>
                <p className="text-xs text-muted-foreground">{o.created_date ? format(new Date(o.created_date), "MMM d, h:mm a") : ""} · {formatMoney(o.final_price)}</p>
              </div>
              <OrderStatusBadge status={o.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
