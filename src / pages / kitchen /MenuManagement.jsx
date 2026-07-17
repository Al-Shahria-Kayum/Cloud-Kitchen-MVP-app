import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, UtensilsCrossed, Loader2 } from "lucide-react";
import MenuItemForm from "@/components/kitchen/MenuItemForm";
import { formatMoney } from "@/lib/kitchen";

export default function MenuManagement() {
  const { user } = useAuth();
  const [kitchen, setKitchen] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    const ks = await base44.entities.Kitchen.filter({ created_by_id: user.id });
    if (!ks[0]) { setLoading(false); return; }
    setKitchen(ks[0]);
    const list = await base44.entities.MenuItem.filter({ kitchen_id: ks[0].id }, "-created_date", 200);
    setItems(list);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user.id]);

  const toggle = async (item) => {
    await base44.entities.MenuItem.update(item.id, { is_available: !item.is_available });
    setItems((p) => p.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i)));
  };

  const remove = async (item) => {
    setDeleting(item.id);
    try {
      await base44.entities.MenuItem.delete(item.id);
      setItems((p) => p.filter((i) => i.id !== item.id));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-6"><Skeleton className="h-64 rounded-2xl" /></div>;
  if (!kitchen) return (
    <div className="mx-auto max-w-lg px-4 py-10 text-center">
      <UtensilsCrossed className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
      <p className="text-muted-foreground">Create your kitchen first before adding menu items.</p>
    </div>
  );

  const availableCount = items.filter((i) => i.is_available).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Menu</h1>
          <p className="text-sm text-muted-foreground">{items.length} items · {availableCount} available</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <UtensilsCrossed className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">No menu items yet. Add your first dish.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                {item.image_url && <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.name}</p>
                {item.description && <p className="line-clamp-1 text-xs text-muted-foreground">{item.description}</p>}
                <p className="text-sm font-semibold text-primary">{formatMoney(item.price)}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={item.is_available ? "text-emerald-600" : "text-muted-foreground"}>{item.is_available ? "On" : "Off"}</span>
                <Switch checked={item.is_available} onCheckedChange={() => toggle(item)} />
              </div>
              <button onClick={() => { setEditing(item); setFormOpen(true); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(item)} disabled={deleting === item.id} className="rounded-lg p-2 text-destructive hover:bg-destructive/10">
                {deleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <MenuItemForm
          kitchenId={kitchen.id}
          item={editing}
          onSaved={load}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}
