/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Admin · territory map data (G-C · S12 ticket 7)

   Real Matin service communities with accurate lat/lng for the routing-table
   TerritoryMap. The communities.json real cohort carries names + live URLs but
   no coordinates, so we geo-anchor the key routed markets here (verified
   Portland-metro + SW Washington centroids). These tie the routing rules'
   "Area: Portland Metro / Lake Oswego" criteria to a spatial map.
   ────────────────────────────────────────────────────────────────────────── */

import type { TerritoryCommunity } from "@/components/os";

/** Key routed service communities (real Matin markets), geo-anchored. */
export const SERVICE_COMMUNITIES: TerritoryCommunity[] = [
  { slug: "lake-oswego-or", name: "Lake Oswego", lat: 45.4207, lng: -122.6706, count: 6 },
  { slug: "west-linn-or", name: "West Linn", lat: 45.3651, lng: -122.6126, count: 5 },
  { slug: "tualatin-or", name: "Tualatin", lat: 45.3843, lng: -122.7637, count: 3 },
  { slug: "tigard-or", name: "Tigard", lat: 45.4312, lng: -122.7715, count: 4 },
  { slug: "sherwood-or", name: "Sherwood", lat: 45.3568, lng: -122.8398, count: 2 },
  { slug: "wilsonville-or", name: "Wilsonville", lat: 45.2987, lng: -122.7732, count: 3 },
  { slug: "oregon-city-or", name: "Oregon City", lat: 45.3573, lng: -122.6068, count: 4 },
  { slug: "vancouver-wa", name: "Vancouver", lat: 45.6387, lng: -122.6615, count: 5 },
  { slug: "battle-ground-wa", name: "Battle Ground", lat: 45.7807, lng: -122.5337, count: 2 },
  { slug: "washougal-wa", name: "Washougal", lat: 45.5826, lng: -122.3534, count: 1 },
];
