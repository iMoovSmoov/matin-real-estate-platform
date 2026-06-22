import { Suspense } from "react";
import { FormsDocsWorkspace } from "@/components/command/forms/FormsDocsWorkspace";

export const metadata = { title: "Forms & Docs" };

export default function FormsPage() {
  // FormsDocsWorkspace reads the `?create=packet` deep-link via useSearchParams,
  // which requires a Suspense boundary on this prerendered route.
  return (
    <Suspense fallback={null}>
      <FormsDocsWorkspace />
    </Suspense>
  );
}
