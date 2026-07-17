import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, CheckCircle2, XCircle, MessageCircle, Loader2, Star, Bike, MapPin, Wallet,
} from "lucide-react";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import Chat from "@/components/Chat";
import { formatMoney, PLATFORM_FEE_RATE, RIDER_FEE_RATE, statusLabel } from "@/lib/kitchen";
import { format } from "date-fns";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hasRated, setHasRated] = useState({ kitchen: false, rider: false });

  const role = user?.role;
  const isCustomer = role === "customer";
  const isKitchen = role === "kitchen_owner";
  const isRider = role === "rider";

  const load = async () => {
    const o = await base44.entities.Order.get(id);
    setOrder(o);
    const its = await base44.entities.OrderItem.filter({ order_id: id });
    setItems(its);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Order.subscribe((event) => {
      if (event.data?.id !== id) return;
      if (event.type === "update") setOrder(event.data);
    });
    return () => unsub && unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!order || !isCustomer) return;
    (async () => {
      const r = await base44.entities.Rating.filter({ order_id: order.id });
      setHasRated({
        kitchen: r.some((x) => x.rating_type === "kitchen"),
        rider: order.rider_id ? r.some((x) => x.rating_type === "rider") : true,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, order?.rider_id, isCustomer]);

  const update = async (patch) => {
    setBusy(true);
    try {
      await base44.entities.Order.update(order.id, patch);
      setOrder((o) => ({ ...o, ...patch }));
    } finally {
      setBusy(false);
    }
  };

  const acceptOrder = async () => {
    setBusy(true);
    try {
      const fee = order.final_price;
      await base44.entities.Order.update(order.id, {
        status: "accepted",
        platform_fee: fee * PLATFORM_FEE_RATE,
        rider_fee: fee * RIDER_FEE_RATE,
      });
      setOrder((o) => ({ ...o, status: "accepted", platform_fee: fee * PLATFORM_FEE_RATE, rider_fee: fee * RIDER_FEE_RATE }));
    } finally {
      setBusy(false);
    }
  };

  const rejectOrder = async () => {
    setBusy(true);
    try {
      await base44.entities.Order.update(order.id, { status: "rejected" });
      setOrder((o) => ({ ...o, status: "rejected" }));
      // Refund is applied on the customer side when the rejected order is next viewed.
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-6"><Skeleton className="h-64 rounded-2xl" /></div>;
  if (!order) return <p className="p-6 text-muted-foreground">Order not found.</p>;

  const otherName = isCustomer ? order.kitchen_name : order.customer_name;
  const showChat = !isRider && !["rejected", "delivered"].includes(order.status);
  const netPayout = order.final_price - (order.platform_fee || 0) - (order.rider_fee || 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-lg font-semibold">Order</h1>
            <p className="text-xs text-muted-foreground">
              {isCustomer && order.kitchen_name}
              {isKitchen && order.customer_name}
              {isRider && (order.kitchen_name || "Delivery")}
              {" · "}{order.created_date ? format(new Date(order.created_date), "MMM d, h:mm a") : ""}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-4 space-y-2 rounded-xl bg-muted/50 p-3">
          {items.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <span>{it.quantity}× {it.name}</span>
              <span className="font-medium">{formatMoney(it.price * it.quantity)}</span>
            </div>
          ))}
          <div className="border-t pt-2 text-sm font-semibold">Total {formatMoney(order.final_price)}</div>
          {order.status !== "pending" && order.status !== "rejected" && (
            <div className="mt-2 space-y-1 border-t pt-2 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Platform fee (10%)</span><span>{formatMoney(order.platform_fee)}</span></div>
              <div className="flex justify-between"><span>Rider fee (5%)</span><span>{formatMoney(order.rider_fee)}</span></div>
              {isKitchen && (
                <div className="flex justify-between font-medium text-emerald-600"><span>Your net payout</span><span>{formatMoney(netPayout)}</span></div>
              )}
            </div>
          )}
        </div>

        {isCustomer && order.delivery_address && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> Delivering to: {order.delivery_address}
          </p>
        )}
        {(isKitchen || isRider) && (
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Pickup: {order.kitchen_name}</p>
            {order.delivery_address && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Drop: {order.delivery_address}</p>}
          </div>
        )}
      </div>

      {/* Kitchen actions */}
      {isKitchen && order.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <Button onClick={acceptOrder} disabled={busy} className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Accept
          </Button>
          <Button onClick={rejectOrder} disabled={busy} variant="outline" className="flex-1 gap-1.5 text-destructive hover:text-destructive">
            <XCircle className="h-4 w-4" /> Reject
          </Button>
        </div>
      )}

      {isKitchen && ["accepted", "preparing", "ready"].includes(order.status) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {order.status === "accepted" && <Button onClick={() => update({ status: "preparing" })} disabled={busy} className="gap-1.5">Start preparing</Button>}
          {order.status === "preparing" && <Button onClick={() => update({ status: "ready" })} disabled={busy} className="gap-1.5">Mark ready</Button>}
          {order.status === "ready" && (
            <Button onClick={() => update({ status: "awaiting_rider" })} disabled={busy} className="gap-1.5">
              <Bike className="h-4 w-4" /> Request delivery
            </Button>
          )}
        </div>
      )}

      {/* Rider actions */}
      {isRider && (
        <div className="mt-4 flex gap-2">
          {order.status === "awaiting_rider" && (
            <Button onClick={() => update({ status: "rider_assigned", rider_id: user.id, rider_name: user.full_name })} disabled={busy} className="flex-1 gap-1.5">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bike className="h-4 w-4" />} Accept delivery
            </Button>
          )}
          {order.status === "rider_assigned" && <Button onClick={() => update({ status: "picked_up" })} disabled={busy} className="gap-1.5">Mark picked up</Button>}
          {order.status === "picked_up" && <Button onClick={() => update({ status: "delivered" })} disabled={busy} className="gap-1.5">Mark delivered</Button>}
        </div>
      )}

      {/* Customer rating CTA */}
      {isCustomer && order.status === "delivered" && (!hasRated.kitchen || !hasRated.rider) && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800"><Star className="h-4 w-4" /> Rate this order</p>
          <p className="mb-3 mt-0.5 text-xs text-amber-700">Help others by sharing your experience.</p>
          <Link to={`/orders/${order.id}/rate`}>
            <Button size="sm">Leave a review</Button>
          </Link>
        </div>
      )}

      {/* Chat */}
      {showChat && (
        <div className="mt-4">
          <button onClick={() => setChatOpen((o) => !o)} className="mb-3 flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <MessageCircle className="h-4 w-4" /> {chatOpen ? "Hide chat" : "Chat with " + otherName}
          </button>
          {chatOpen && <Chat orderId={order.id} otherName={otherName} />}
        </div>
      )}
    </div>
  );
}
