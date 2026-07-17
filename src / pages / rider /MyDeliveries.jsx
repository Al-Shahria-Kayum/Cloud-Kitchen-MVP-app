import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck } from "lucide-react";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { formatMoney } from "@/lib/kitchen";
import { format } from "date-fns";

export default function MyDeliveries() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const list = await base44.entities.Order.filter({ rider_id: user.id }, "-created_date", 200);
    setOrders(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Order.subscribe((event) => {
      if (event.data?.rider_id !== user.id) return;
      if (event.type === "update") setOrders((p) => p.map((o) => (o.id === event.data.id ? event.data : o)));
    });
    return () => unsub && unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const active = orders.filter((o) => ["rider_assigned", "picked_up"].includes(o.status));
  const done = orders.filter((o) => o.status === "delivered");

  if (loading) return <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-5 font-heading text-2xl font-semibold">My deliveries</h1>

      {active.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-medium uppercase text-muted-foreground">Active</h2>
          <div className="mb-6 space-y-2">
            {active.map((o) => (
              <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between rounded-xl border bg-card p-3 hover:border-primary/30">
                <div><p className="font-medium">{o.kitchen_name} → {o.customer_name}</p><p className="text-xs text-muted-foreground">{o.created_date ? format(new Date(o.created_date), "MMM d, h:mm a") : ""}</p></div>
                <OrderStatusBadge status={o.status} />
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-2 text-sm font-medium uppercase text-muted-foreground">Completed</h2>
      {done.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
          <Truck className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No completed deliveries yet.
        </div>
      ) : (
        <div className="space-y-2">
          {done.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between rounded-xl border bg-card p-3 hover:border-primary/30">
              <div><p className="font-medium">{o.kitchen_name} → {o.customer_name}</p><p className="text-xs text-muted-foreground">{format(new Date(o.created_date), "MMM d")}</p></div>
              <p className="text-sm font-semibold text-emerald-600">+{formatMoney(o.rider_fee)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
