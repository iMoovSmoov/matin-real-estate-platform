"use client";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — TerritoryMapInner   (ref G-C) — IMPLEMENTATION ONLY

   The client-only Leaflet implementation behind <TerritoryMap/>. It is loaded
   EXCLUSIVELY via `dynamic(() => import("./TerritoryMapInner"), { ssr:false })`
   from TerritoryMap.tsx, mirroring the repo's CommunityMap → PropertyMap split.
   Because it is never imported server-side, the top-level `leaflet` import
   (which touches `window`) is safe and only loads client-side. Do not import
   this module directly anywhere except through the TerritoryMap wrapper.
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MATIN_OFFICES,
  PORTLAND_METRO_CENTER,
  type TerritoryMapProps,
} from "./TerritoryMap.shared";

function officeIcon(hq?: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [34, 34] as [number, number],
    iconAnchor: [17, 17] as [number, number],
    popupAnchor: [0, -18] as [number, number],
    // Ink chip carrying the Matin favicon mark — brand pin, not the OSM blue.
    html: `<div style="width:34px;height:34px;border-radius:10px;background:#0d0d0e;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.4);${
      hq ? "outline:2px solid #b8924a;outline-offset:1px;" : ""
    }"><img src="/matin/brand/logo-favicon-32x32.png" alt="Matin" style="width:20px;height:20px;filter:brightness(10)" /></div>`,
  });
}

function priceIcon(price: number): L.DivIcon {
  const label =
    price >= 1_000_000
      ? `$${(price / 1_000_000).toFixed(1)}M`
      : `$${Math.round(price / 1_000)}K`;
  return L.divIcon({
    className: "",
    iconSize: [62, 26] as [number, number],
    iconAnchor: [31, 13] as [number, number],
    popupAnchor: [0, -16] as [number, number],
    html: `<div style="background:#161617;color:#fff;border-radius:999px;padding:4px 11px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.35);letter-spacing:0.02em">${label}</div>`,
  });
}

function communityIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [16, 16] as [number, number],
    iconAnchor: [8, 8] as [number, number],
    popupAnchor: [0, -10] as [number, number],
    html: `<div style="width:14px;height:14px;border-radius:999px;background:#b8924a;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
  });
}

function priceLabel(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function TerritoryMapInner({
  listings = [],
  communities = [],
  offices = MATIN_OFFICES,
  center = PORTLAND_METRO_CENTER,
  zoom = 10,
  onSelectListing,
}: Omit<TerritoryMapProps, "className" | "height">) {
  // Repair the default marker icon URLs (same fix as site/PropertyMap).
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      {/* Monochrome-luxe basemap (CARTO Positron) — no loud default blue. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {/* Real Matin offices — always rendered. */}
      {offices.map((o) => (
        <Marker key={o.name} position={[o.lat, o.lng]} icon={officeIcon(o.hq)}>
          <Popup minWidth={200}>
            <div style={{ fontFamily: "inherit", padding: "2px 0" }}>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "#0d0d0e", lineHeight: 1.3 }}>
                {o.label}
              </div>
              <div style={{ marginTop: "3px", fontSize: "12px", color: "#0d0d0e", opacity: 0.78, lineHeight: 1.4 }}>
                {o.address}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Optional community pins. */}
      {communities
        .filter((c) => c.lat != null && c.lng != null)
        .map((c) => (
          <Marker key={c.slug} position={[c.lat, c.lng]} icon={communityIcon()}>
            <Popup minWidth={160}>
              <div style={{ fontFamily: "inherit", padding: "2px 0" }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "#0d0d0e", lineHeight: 1.3 }}>
                  {c.name}
                </div>
                {c.count != null ? (
                  <div style={{ marginTop: "2px", fontSize: "12px", color: "#62626a" }}>
                    {c.count} active listing{c.count === 1 ? "" : "s"}
                  </div>
                ) : null}
                {c.href ? (
                  <a
                    href={c.href}
                    style={{
                      display: "inline-block",
                      marginTop: "8px",
                      borderRadius: "999px",
                      background: "#0d0d0e",
                      color: "#fff",
                      padding: "4px 14px",
                      fontSize: "11px",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    View community →
                  </a>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Optional listing pins (price-labeled). */}
      {listings
        .filter((l) => l.lat != null && l.lng != null)
        .map((l) => (
          <Marker
            key={l.id}
            position={[l.lat, l.lng]}
            icon={priceIcon(l.price)}
            eventHandlers={{ click: () => onSelectListing?.(l.id) }}
          >
            <Popup minWidth={200}>
              <div style={{ fontFamily: "inherit", padding: "2px 0" }}>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "#0d0d0e", lineHeight: 1.3 }}>
                  {priceLabel(l.price)}
                </div>
                <div style={{ marginTop: "3px", fontSize: "12px", color: "#0d0d0e", opacity: 0.8, lineHeight: 1.4 }}>
                  {l.address}
                </div>
                {l.beds != null && l.baths != null ? (
                  <div style={{ marginTop: "2px", fontSize: "12px", color: "#62626a" }}>
                    {l.beds} bd &middot; {l.baths} ba
                  </div>
                ) : null}
                {l.href ? (
                  <a
                    href={l.href}
                    style={{
                      display: "inline-block",
                      marginTop: "8px",
                      borderRadius: "999px",
                      background: "#0d0d0e",
                      color: "#fff",
                      padding: "4px 14px",
                      fontSize: "11px",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    View listing →
                  </a>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
