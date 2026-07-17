import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/kitchen";

export default function AddDemoBalance({ amount = 500, label, onUpdated }) {
  const { user, checkUserAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const balance = user?.wallet_balance ?? 0;

  const add = async () => {
    setLoading(true);
    try {
      const next = Number(balance) + amount;
      await base44.auth.updateMe({ wallet_balance: next });
      await checkUserAuth();
      onUpdated?.(next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-amber-600" />
        <div>
          <div className="text-xs font-medium text-amber-700">Demo wallet</div>
          <div className="text-lg font-semibold text-amber-900">{formatMoney(balance)}</div>
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={add} disabled={loading} className="gap-1.5">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {label || `+${formatMoney(amount)}`}
      </Button>
    </div>
  );
}
