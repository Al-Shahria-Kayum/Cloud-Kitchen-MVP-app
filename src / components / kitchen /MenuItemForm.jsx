import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatMoney } from "@/lib/kitchen";

export default function MenuItemForm({ kitchenId, item, onSaved, onClose }) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(item?.price?.toString() || "");
  const [imageUrl, setImageUrl] = useState(item?.image_url || "");
  const [available, setAvailable] = useState(item?.is_available ?? true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const upload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const priceNum = Number(price);
    if (!name || !priceNum || priceNum <= 0) return;
    setSaving(true);
    try {
      const payload = {
        kitchen_id: kitchenId,
        name, description,
        price: priceNum,
        image_url: imageUrl,
        is_available: available,
      };
      if (item) {
        await base44.entities.MenuItem.update(item.id, payload);
      } else {
        await base44.entities.MenuItem.create(payload);
      }
      onSaved?.();
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl border bg-card p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">{item ? "Edit item" : "Add menu item"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="iname">Name *</Label>
            <Input id="iname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Margherita pizza" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iprice">Price *</Label>
            <Input id="iprice" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idesc">Description</Label>
            <Textarea id="idesc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Fresh basil, mozzarella…" />
          </div>
          <div className="space-y-2">
            <Label>Image</Label>
            <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
            {imageUrl && <img src={imageUrl} alt="preview" className="h-24 w-full rounded-lg object-cover" />}
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <Label htmlFor="avail" className="cursor-pointer">Available for ordering</Label>
            <Switch id="avail" checked={available} onCheckedChange={setAvailable} />
          </div>
          <Button className="w-full" onClick={save} disabled={saving || !name || !price}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {saving ? "Saving…" : item ? "Save changes" : "Add item"}
          </Button>
          {price && Number(price) > 0 && <p className="text-center text-xs text-muted-foreground">Customer pays {formatMoney(Number(price))}</p>}
        </div>
      </div>
    </div>
  );
}
