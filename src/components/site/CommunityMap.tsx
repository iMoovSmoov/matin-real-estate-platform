"use client";
import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("@/components/site/PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-paper text-sm text-slate">
      Loading map…
    </div>
  ),
});

export { PropertyMap as CommunityMap };
