import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bike, MapPin, Loader2, Wallet, Truck } from "lucide-react";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { formatMoney, formatDistance, haversineKm, getLocation } from "@/lib/kitchen";
import { format } from "date-fns";

export default function RiderHome() {
  const { user } = useAuth();
  const [available, setAvailable] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [origin, setOrigin] = useState(null);

  const load = async () => {
    const list = await base44.entities.Order.filter({ status: "awaiting_rider" }, "-created_date", 100);
    setAvailable(list);
    const mine = await base44.entities.Order.filter({ rider_id: user.id }, "-created_date", 200);
    const delivered = mine.filter((o) => o.status === "delivered");
    setEarnings(delivered.reduce((a, o) => a + Number(o.rider_fee || 0), 0));
    setDeliveredCount(delivered.length);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      if (user?.current_lat != null) setOrigin({ latitude: user.current_lat, longitude: user.current_lng });
      load();
    })();
    const unsub = base44.entities.Order.subscribe((event) => {
      if (event.data?.status === "awaiting_rider" && event.type === "update") {
        setAvailable((p) => (p.some((o) => o.id === event.data.id) ? p : [event.data, ...p]));
      }
      if (event.type === "update" && event.data?.rider_id === user.id) load();
    });
    return () => unsub && unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const refreshLocation = async () => {
    setLocating(true);
    const loc = await getLocation();
    if (loc) {
      setOrigin(loc);
      await base44.auth.updateMe({ current_lat: loc.latitude, current_lng: loc.longitude });
    }
    setLocating(false);
  };

  const accept = async (order) => {
    await base44.entities.Order.update(order.id, { status: "rider_assigned", rider_id: user.id, rider_name: user.full_name });
    setAvailable((p) => p.filter((o) => o.id !== order.id));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Available deliveries</h1>
          <p className="text-sm text-muted-foreground">Accept a pickup near you.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshLocation} disabled={locating} className="gap-1.5">
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          Refresh location
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Wallet className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">Earnings</p><p className="text-lg font-semibold">{formatMoney(earnings)}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Truck className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">Delivered</p><p className="text-lg font-semibold">{deliveredCount}</p></div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <Bike className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">{available.length} awaiting rider</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : available.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
          No deliveries available right now. New ones appear here instantly.
        </div>
      ) : (
        <div className="space-y-3">
          {available.map((o) => {
            const dist = origin ? haversineKm(origin.latitude, origin.longitude, o.delivery_lat, o.delivery_lng) : null;
            return (
              <div key={o.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{o.kitchen_name} → {o.customer_name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {o.delivery_address || "Address on file"}</p>
                    <p className="text-xs text-muted-foreground">{o.created_date ? format(new Date(o.created_date), "MMM d, h:mm a") : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">+{formatMoney(o.rider_fee)}</p>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{dist != null ? `${formatDistance(dist)} to drop` : ""}</span>
                  <Button size="sm" onClick={() => accept(o)} className="gap-1.5"><Bike className="h-4 w-4" /> Accept delivery</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link to="/rider/deliveries" className="mt-6 block text-center text-sm font-medium text-primary hover:underline">
        My active deliveries →
      </Link>
    </div>
  );
}
