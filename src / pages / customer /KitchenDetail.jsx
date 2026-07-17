import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Loader2, ShoppingCart, CheckCircle2 } from "lucide-react";
import AddDemoBalance from "@/components/AddDemoBalance";
import { AverageStars } from "@/components/StarRating";
import { formatMoney, formatDistance, haversineKm } from "@/lib/kitchen";

export default function KitchenDetail() {
  const { kitchenId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kitchen, setKitchen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [ratings, setRatings] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    (async () => {
      try {
        const k = await base44.entities.Kitchen.get(kitchenId);
        setKitchen(k);
        const list = await base44.entities.MenuItem.filter({ kitchen_id: kitchenId }, "created_date", 100);
        setItems(list.filter((i) => i.is_available));
        const rs = k ? await base44.entities.Rating.filter({ rated_user_id: k.created_by_id, rating_type: "kitchen" }) : [];
        setRatings(rs.length ? { avg: rs.reduce((a, r) => a + r.stars, 0) / rs.length, count: rs.length } : { avg: 0, count: 0 });
      } finally {
        setLoading(false);
        setItemsLoading(false);
      }
    })();
  }, [kitchenId]);

  const totalPrice = selected ? Number(selected.price) * qty : 0;
  const balance = user?.wallet_balance ?? 0;
  const insufficient = totalPrice > balance;

  const placeOrder = async () => {
    if (!selected || insufficient) return;
    setPlacing(true);
    try {
      const finalPrice = Number(selected.price) * qty;
      const order = await base44.entities.Order.create({
        customer_id: user.id,
        customer_name: user.full_name,
        kitchen_id: kitchen.id,
        kitchen_name: kitchen.name,
        kitchen_owner_id: kitchen.created_by_id,
        status: "pending",
        item_total: finalPrice,
        final_price: finalPrice,
        platform_fee: 0,
        rider_fee: 0,
        delivery_address: user.address || "Not provided",
        delivery_lat: user.latitude,
        delivery_lng: user.longitude,
      });
      await base44.entities.OrderItem.create({
        order_id: order.id,
        menu_item_id: selected.id,
        name: selected.name,
        price: selected.price,
        quantity: qty,
      });
      await base44.auth.updateMe({ wallet_balance: Number(balance) - finalPrice });
      navigate("/orders");
    } finally {
      setPlacing(false);
    }
  };

  const dist =
    kitchen && user?.latitude != null
      ? haversineKm(user.latitude, user.longitude, kitchen.latitude, kitchen.longitude)
      : null;

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-6"><Skeleton className="h-72 rounded-2xl" /></div>;
  if (!kitchen) return <p className="p-6 text-muted-foreground">Kitchen not found.</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="relative h-40 bg-muted">
          {kitchen.image_url && <img src={kitchen.image_url} alt={kitchen.name} className="h-full w-full object-cover" />}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-heading text-xl font-semibold">{kitchen.name}</h1>
              {kitchen.cuisine && <p className="text-sm text-muted-foreground">{kitchen.cuisine}</p>}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <AverageStars value={ratings.avg} count={ratings.count} />
              {dist != null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {formatDistance(dist)} away
                </span>
              )}
            </div>
          </div>
          {kitchen.description && <p className="mt-2 text-sm text-muted-foreground">{kitchen.description}</p>}
          {kitchen.address && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {kitchen.address}
            </p>
          )}
        </div>
      </div>

      <h2 className="mb-3 mt-6 font-heading text-lg font-semibold">Menu</h2>
      {itemsLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">This kitchen hasn't added any items yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const active = selected?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setSelected(item); setQty(1); }}
                className={`flex gap-3 rounded-2xl border bg-card p-3 text-left transition-all ${active ? "border-primary ring-1 ring-primary" : "hover:border-primary/30"}`}
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {item.image_url && <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium">{item.name}</h3>
                    {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  {item.description && <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
                  <p className="mt-1 text-sm font-semibold text-primary">{formatMoney(item.price)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="sticky bottom-16 z-10 mt-6 rounded-2xl border bg-card p-4 shadow-lg md:bottom-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{selected.name}</p>
              <p className="text-xs text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatMoney(totalPrice)}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border">
                <button className="px-3 py-1.5 text-sm" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span className="w-8 text-center text-sm font-medium">{qty}</span>
                <button className="px-3 py-1.5 text-sm" onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
              <Button onClick={placeOrder} disabled={placing || insufficient} className="gap-1.5">
                {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                Place order
              </Button>
            </div>
          </div>
          {insufficient && (
            <div className="mt-3">
              <AddDemoBalance amount={Math.ceil((totalPrice - balance) / 100) * 100 + 500} label="Add demo balance" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
