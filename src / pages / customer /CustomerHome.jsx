import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Search } from "lucide-react";
import { haversineKm, formatDistance, getLocation } from "@/lib/kitchen";
import { AverageStars } from "@/components/StarRating";

export default function CustomerHome() {
  const { user } = useAuth();
  const [kitchens, setKitchens] = useState([]);
  const [ratingsMap, setRatingsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState(null);
  const [radius, setRadius] = useState(20);
  const [query, setQuery] = useState("");

  const loadKitchens = async () => {
    const list = await base44.entities.Kitchen.list("-created_date", 100);
    setKitchens(list);
    // ratings per owner
    const byOwner = {};
    await Promise.all(
      list.map(async (k) => {
        const rs = await base44.entities.Rating.filter({ rated_user_id: k.created_by_id, rating_type: "kitchen" });
        byOwner[k.created_by_id] = {
          avg: rs.length ? rs.reduce((a, r) => a + r.stars, 0) / rs.length : 0,
          count: rs.length,
        };
      })
    );
    setRatingsMap(byOwner);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const loc = user?.latitude != null ? { latitude: user.latitude, longitude: user.longitude } : await getLocation();
      if (loc) setOrigin(loc);
      loadKitchens();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return kitchens
      .map((k) => ({
        ...k,
        dist: origin ? haversineKm(origin.latitude, origin.longitude, k.latitude, k.longitude) : null,
      }))
      .filter((k) => {
        const within = k.dist == null || k.dist <= radius;
        const matches = !query || k.name?.toLowerCase().includes(query.toLowerCase()) || k.cuisine?.toLowerCase().includes(query.toLowerCase());
        return within && matches;
      })
      .sort((a, b) => (a.dist == null ? 1 : a.dist - b.dist));
  }, [kitchens, origin, radius, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold">Nearby kitchens</h1>
        <p className="text-sm text-muted-foreground">Fresh meals from local cloud kitchens near you.</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search kitchen or cuisine" className="pl-9" />
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Max</span>
          <input type="range" min="2" max="50" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="accent-primary" />
          <span className="w-14 font-medium">{radius} km</span>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
          No kitchens found within {radius} km. Try widening your radius.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((k) => {
            const r = ratingsMap[k.created_by_id] || { avg: 0, count: 0 };
            return (
              <Link
                key={k.id}
                to={`/customer/kitchen/${k.id}`}
                className="group overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-36 overflow-hidden bg-muted">
                  {k.image_url ? (
                    <img src={k.image_url} alt={k.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Star className="h-8 w-8 opacity-40" />
                    </div>
                  )}
                  {k.cuisine && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
                      {k.cuisine}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-semibold">{k.name}</h3>
                    {k.dist != null && (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {formatDistance(k.dist)}
                      </span>
                    )}
                  </div>
                  {k.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{k.description}</p>}
                  <div className="mt-2.5">
                    <AverageStars value={r.avg} count={r.count} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
