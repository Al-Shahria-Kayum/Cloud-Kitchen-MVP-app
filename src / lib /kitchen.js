export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "preparing",
  "ready",
  "awaiting_rider",
  "rider_assigned",
  "picked_up",
  "delivered",
];

export const PLATFORM_FEE_RATE = 0.1;
export const RIDER_FEE_RATE = 0.05;
export const DEMO_STARTING_BALANCE = 1000;

export const statusLabel = (s) => ({
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  preparing: "Preparing",
  ready: "Ready for pickup",
  awaiting_rider: "Awaiting rider",
  rider_assigned: "Rider assigned",
  picked_up: "Picked up",
  delivered: "Delivered",
}[s] || s);

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
  preparing: "bg-violet-100 text-violet-700 border-violet-200",
  ready: "bg-teal-100 text-teal-700 border-teal-200",
  awaiting_rider: "bg-orange-100 text-orange-700 border-orange-200",
  rider_assigned: "bg-indigo-100 text-indigo-700 border-indigo-200",
  picked_up: "bg-cyan-100 text-cyan-700 border-cyan-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export const statusClass = (s) => STATUS_STYLES[s] || "bg-muted text-muted-foreground border-border";

export const formatMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

export const haversineKm = (lat1, lng1, lat2, lng2) => {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistance = (km) => {
  if (km == null) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

export const getLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000 }
    );
  });
