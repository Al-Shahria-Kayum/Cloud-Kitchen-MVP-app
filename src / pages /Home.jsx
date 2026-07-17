import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import CustomerHome from "@/pages/customer/CustomerHome";
import KitchenHome from "@/pages/kitchen/KitchenHome";
import RiderHome from "@/pages/rider/RiderHome";
import Onboarding from "@/components/Onboarding";

export default function Home() {
  const { user } = useAuth();
  if (!user?.role) return <Onboarding />;
  if (user.role === "customer") return <CustomerHome />;
  if (user.role === "kitchen_owner") return <KitchenHome />;
  if (user.role === "rider") return <RiderHome />;
  return <Onboarding />;
}
