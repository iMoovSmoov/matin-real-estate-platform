import type { Metadata } from "next";
import { SearchExperience } from "@/components/site/property/SearchExperience";
import { listings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Property Search — Matin Real Estate",
  description:
    "Search active homes across Portland, Lake Oswego, West Linn and SW Washington. Filter by price, beds, type and status.",
};

export default async function PropertySearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; price?: string; beds?: string }>;
}) {
  const { q = "", type = "", price = "", beds = "" } = await searchParams;

  return (
    <SearchExperience
      listings={listings}
      initialQuery={q}
      initialType={type}
      initialMinBeds={beds ? Number(beds) : 0}
      initialMaxPrice={price}
    />
  );
}
