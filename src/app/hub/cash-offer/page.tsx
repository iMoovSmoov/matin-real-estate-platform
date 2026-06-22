import { Suspense } from "react";
import { SellerDeskWorkspace } from "@/components/command/seller/SellerDeskWorkspace";

export default function CashOfferPage() {
  // Suspense boundary required because SellerDeskWorkspace reads the `create`
  // search param (deep-link auto-open) via useSearchParams (Next.js 16).
  return (
    <Suspense>
      <SellerDeskWorkspace />
    </Suspense>
  );
}
