import { Suspense } from "react";
import OrdersView from "@/components/admin/OrdersView";

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="skeleton mx-auto mt-10 h-40 max-w-6xl" aria-busy="true" />}>
      <OrdersView />
    </Suspense>
  );
}
