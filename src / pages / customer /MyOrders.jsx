import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { formatMoney } from "@/lib/kitchen";
import { format } from "date-fns";

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState({});

  const processRefunds = async (list) => {
    const needs = list.filter((o) => o.status === "rejected" && !o.refunded);
    for (const o of needs) {
      try {
        const me = await base44.auth.me();
        await base44.auth.updateMe({ wallet_balance: Number(me.wallet_balance || 0) + Number(o.final_price) });
        await base44.entities.Order.update(o.id, { refunded: true });
      } catch (e) { /* ignore race */ }
    }
  };

  const load = async () => {
    const list = await base44.entities.Order.filter({ customer_id: user.id }, "-created_date", 100);
    setOrders(list);
    setLoading(false);
    processRefunds(list);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Order.subscribe((event) => {
      if (event.data?.customer_id !== user.id) return;
      if (event.type === "create") setOrders((p) => [event.data, ...p]);
      if (event.type === "update") {
        setOrders((p) => p.map((o) => (o.id === event.data.id ? event.data : o)));
        if (event.data.status === "rejected" && !event.data.refunded) processRefunds([event.data]);
      }
    });
    return () => unsub && unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  if (loading) return <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-5 font-heading text-2xl font-semibold">My orders</h1>
      {orders.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          <Link to="/customer" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Browse kitchens →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="block rounded-2xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{o.kitchen_name}</p>
                  <p className="text-xs text-muted-foreground">{o.created_date ? format(new Date(o.created_date), "MMM d, h:mm a") : ""}</p>
                </div>
                <OrderStatusBadge status={o.status} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm font-medium">{formatMoney(o.final_price)}</p>
                {o.status === "rejected" && o.refunded && <span className="text-xs text-emerald-600">Refunded to wallet</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
