import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Loader2, UtensilsCrossed, ClipboardList, TrendingUp, PackageCheck } from "lucide-react";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { formatMoney } from "@/lib/kitchen";
import { format } from "date-fns";

const TONES = { amber: "bg-amber-100 text-amber-700", blue: "bg-blue-100 text-blue-700", emerald: "bg-emerald-100 text-emerald-700" };

function Stat({ label, value, icon: Icon, tone }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${TONES[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold leading-tight">{value}</p>
      </div>
    </div>
  );
}

export default function KitchenHome() {
  const { user } = useAuth();
  const [kitchen, setKitchen] = useState(null);
  const [checking, setChecking] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", address: "", cuisine: "", image_url: "" });
  const [activeOrders, setActiveOrders] = useState([]);

  const load = async () => {
    const ks = await base44.entities.Kitchen.filter({ created_by_id: user.id });
    if (ks[0]) {
      setKitchen(ks[0]);
      const orders = await base44.entities.Order.filter({ kitchen_id: ks[0].id }, "-created_date", 100);
      setActiveOrders(orders);
    }
    setChecking(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const createKitchen = async () => {
    if (!form.name) return;
    setCreating(true);
    try {
      const k = await base44.entities.Kitchen.create({
        name: form.name,
        description: form.description,
        address: form.address,
        cuisine: form.cuisine,
        image_url: form.image_url,
        latitude: user.latitude,
        longitude: user.longitude,
      });
      setKitchen(k);
    } finally {
      setCreating(false);
    }
  };

  const uploadImage = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, image_url: file_url }));
  };

  if (checking) return <div className="mx-auto max-w-3xl px-4 py-6"><Skeleton className="h-64 rounded-2xl" /></div>;

  if (!kitchen) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-2xl font-semibold">Set up your kitchen</h1>
          <p className="text-sm text-muted-foreground">Create your kitchen profile to start receiving orders.</p>
        </div>
        <div className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="space-y-2">
            <Label htmlFor="kname">Kitchen name *</Label>
            <Input id="kname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Saffron & Smoke" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cuisine">Cuisine</Label>
            <Input id="cuisine" value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} placeholder="Indian, BBQ…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addr">Address</Label>
            <Input id="addr" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Kitchen pickup address" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What makes your kitchen special?" />
          </div>
          <div className="space-y-2">
            <Label>Cover image</Label>
            <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
            {form.image_url && <img src={form.image_url} alt="preview" className="h-24 w-full rounded-lg object-cover" />}
          </div>
          <Button className="w-full" onClick={createKitchen} disabled={creating || !form.name}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Create kitchen
          </Button>
        </div>
      </div>
    );
  }

  const pendingCount = activeOrders.filter((o) => o.status === "pending").length;
  const activeCount = activeOrders.filter((o) => ["accepted", "preparing", "ready", "awaiting_rider"].includes(o.status)).length;
  const completedCount = activeOrders.filter((o) => o.status === "delivered").length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-14 w-14 overflow-hidden rounded-2xl bg-muted">
          {kitchen.image_url && <img src={kitchen.image_url} alt={kitchen.name} className="h-full w-full object-cover" />}
        </div>
        <div>
          <h1 className="font-heading text-2xl font-semibold">{kitchen.name}</h1>
          {kitchen.cuisine && <p className="text-sm text-muted-foreground">{kitchen.cuisine}</p>}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pending" value={pendingCount} icon={ClipboardList} tone="amber" />
        <Stat label="Active" value={activeCount} icon={TrendingUp} tone="blue" />
        <Stat label="Delivered" value={completedCount} icon={PackageCheck} tone="emerald" />
        <Link to="/kitchen/menu" className="flex">
          <div className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><UtensilsCrossed className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Menu</p>
              <p className="text-sm font-semibold leading-tight">Manage →</p>
            </div>
          </div>
        </Link>
      </div>

      <h2 className="mb-3 font-heading text-lg font-semibold">Recent orders</h2>
      {activeOrders.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">No orders yet. Once a customer orders, it'll appear here in real time.</p>
      ) : (
        <div className="space-y-2">
          {activeOrders.slice(0, 8).map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between rounded-xl border bg-card p-3 hover:border-primary/30">
              <div>
                <p className="text-sm font-medium">{o.customer_name}</p>
                <p className="text-xs text-muted-foreground">{o.created_date ? format(new Date(o.created_date), "MMM d, h:mm a") : ""} · {formatMoney(o.final_price)}</p>
              </div>
              <OrderStatusBadge status={o.status} />
            </Link>
          ))}
          <Link to="/kitchen/orders" className="block py-2 text-center text-sm font-medium text-primary hover:underline">View all orders →</Link>
        </div>
      )}
    </div>
  );
}
