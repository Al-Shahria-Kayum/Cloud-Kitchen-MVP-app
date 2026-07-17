import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Store, Bike, CheckCircle2 } from "lucide-react";
import StarRating from "@/components/StarRating";

export default function RateOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [kitchen, setKitchen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState([]);
  const [kStars, setKStars] = useState(0);
  const [rStars, setRStars] = useState(0);
  const [kReview, setKReview] = useState("");
  const [rReview, setRReview] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const o = await base44.entities.Order.get(id);
      setOrder(o);
      if (o) {
        const k = await base44.entities.Kitchen.get(o.kitchen_id);
        setKitchen(k);
      }
      const r = await base44.entities.Rating.filter({ order_id: id });
      setExisting(r);
      setLoading(false);
    })();
  }, [id]);

  const submit = async () => {
    setSaving(true);
    try {
      const kitchenRated = existing.some((x) => x.rating_type === "kitchen");
      const riderRated = existing.some((x) => x.rating_type === "rider");
      const tasks = [];
      if (!kitchenRated && kStars > 0) {
        tasks.push(base44.entities.Rating.create({
          order_id: id,
          rated_user_id: kitchen?.created_by_id,
          rated_by_user_id: user.id,
          rating_type: "kitchen",
          stars: kStars,
          review_text: kReview,
        }));
      }
      if (order.rider_id && !riderRated && rStars > 0) {
        tasks.push(base44.entities.Rating.create({
          order_id: id,
          rated_user_id: order.rider_id,
          rated_by_user_id: user.id,
          rating_type: "rider",
          stars: rStars,
          review_text: rReview,
        }));
      }
      await Promise.all(tasks);
      setDone(true);
      setTimeout(() => navigate(`/orders/${id}`), 900);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-lg px-4 py-6"><Skeleton className="h-40 rounded-2xl" /></div>;
  if (!order) return <p className="p-6 text-muted-foreground">Order not found.</p>;
  if (done) return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
      <h2 className="font-heading text-lg font-semibold">Thanks for your review!</h2>
      <p className="text-sm text-muted-foreground">Redirecting…</p>
    </div>
  );

  const kitchenRated = existing.some((x) => x.rating_type === "kitchen");
  const riderRated = existing.some((x) => x.rating_type === "rider");
  const canSubmitKitchen = !kitchenRated && kStars > 0;
  const canSubmitRider = order.rider_id && !riderRated && rStars > 0;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-5 font-heading text-2xl font-semibold">Rate your order</h1>

      {!kitchenRated && (
        <div className="mb-4 rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            <span className="font-medium">{order.kitchen_name}</span>
          </div>
          <Label className="mb-2 block text-sm">Food quality</Label>
          <StarRating value={kStars} onChange={setKStars} size={28} />
          <Textarea value={kReview} onChange={(e) => setKReview(e.target.value)} placeholder="Write a review (optional)" className="mt-3" rows={3} />
        </div>
      )}

      {order.rider_id && !riderRated && (
        <div className="mb-4 rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bike className="h-4 w-4 text-primary" />
            <span className="font-medium">Delivery by {order.rider_name || "Rider"}</span>
          </div>
          <Label className="mb-2 block text-sm">Delivery service</Label>
          <StarRating value={rStars} onChange={setRStars} size={28} />
          <Textarea value={rReview} onChange={(e) => setRReview(e.target.value)} placeholder="Write a review (optional)" className="mt-3" rows={3} />
        </div>
      )}

      <Button className="w-full" onClick={submit} disabled={saving || (!canSubmitKitchen && !canSubmitRider)}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Submit review
      </Button>
    </div>
  );
}
