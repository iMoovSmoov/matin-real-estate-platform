import { Suspense } from "react";
import BuyerAgreementBuilder from "@/components/command/buyer/BuyerAgreementBuilder";

export default function BuyerAgreementsPage() {
  return (
    <Suspense fallback={null}>
      <BuyerAgreementBuilder />
    </Suspense>
  );
}
