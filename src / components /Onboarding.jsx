import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Store, Bike, ShoppingBag, MapPin } from "lucide-react";
import { getLocation } from "@/lib/kitchen";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "customer", label: "Customer", desc: "Browse kitchens and order food", icon: ShoppingBag },
  { value: "kitchen_owner", label: "Kitchen Owner", desc: "Run your kitchen and accept orders", icon: Store },
  { value: "rider", label: "Delivery Rider", desc: "Pick up and deliver orders, earn fees", icon: Bike },
];

export default function Onboarding() {
  const { user, checkUserAuth } = useAuth();
  const [role, setRole] = useState("customer");
  const [name, setName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState(null);
  const [saving, setSaving] = useState(false);

  const detectLocation = async () => {
    setLocating(true);
    const loc = await getLocation();
    if (loc) setCoords(loc);
    setLocating(false);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const patch = {
        role,
        phone,
        address,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        current_lat: coords?.latitude,
        current_lng: coords?.longitude,
        wallet_balance: 1000,
        full_name: name,
      };
      await base44.auth.updateMe(patch);
      await checkUserAuth();
      window.location.href = "/";
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Store className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-2xl font-semibold">Welcome to Cloud Kitchen</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tell us a bit about you to set up your account.</p>
      </div>

      <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <Label className="mb-2 block">I want to join as</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                    active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-xs font-medium">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" />
          <Button type="button" variant="outline" size="sm" onClick={detectLocation} disabled={locating} className="gap-1.5">
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            {coords ? "Location detected" : "Detect my location"}
          </Button>
          {coords && (
            <p className="text-xs text-muted-foreground">
              {coords.latitude?.toFixed(4)}, {coords.longitude?.toFixed(4)}
            </p>
          )}
        </div>

        <Button className="w-full" onClick={submit} disabled={saving || !name}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {saving ? "Saving…" : "Continue"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">You'll start with a $1,000 demo wallet (not real money).</p>
      </div>
    </div>
  );
}
