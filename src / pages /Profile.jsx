import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, User as UserIcon, Wallet } from "lucide-react";
import { formatMoney, getLocation } from "@/lib/kitchen";
import AddDemoBalance from "@/components/AddDemoBalance";

export default function Profile() {
  const { user, checkUserAuth } = useAuth();
  const [name, setName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState(null);

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        full_name: name,
        phone,
        address,
        latitude: coords?.latitude ?? user?.latitude,
        longitude: coords?.longitude ?? user?.longitude,
        current_lat: coords?.latitude ?? user?.current_lat,
        current_lng: coords?.longitude ?? user?.current_lng,
      });
      await checkUserAuth();
    } finally {
      setSaving(false);
    }
  };

  const detect = async () => {
    setLocating(true);
    const loc = await getLocation();
    if (loc) setCoords(loc);
    setLocating(false);
  };

  const roleLabel = { customer: "Customer", kitchen_owner: "Kitchen Owner", rider: "Rider" }[user?.role] || user?.role;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-5 font-heading text-2xl font-semibold">Profile</h1>

      <div className="mb-4 flex items-center gap-3 rounded-2xl border bg-card p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserIcon className="h-6 w-6" /></div>
        <div>
          <p className="font-medium">{user?.email}</p>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>
      </div>

      {user?.role === "customer" && (
        <div className="mb-4"><AddDemoBalance amount={500} /></div>
      )}

      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="pname">Full name</Label>
          <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pphone">Phone</Label>
          <Input id="pphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paddr">Address</Label>
          <Input id="paddr" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={detect} disabled={locating} className="gap-1.5">
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          {coords ? "Location updated" : "Update my location"}
        </Button>
        {coords && <p className="text-xs text-muted-foreground">{coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}</p>}
        <Button className="w-full" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save profile
        </Button>
      </div>
    </div>
  );
}
