"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import type { Listing } from "@/lib/types";

function makePriceIcon(price: number, active = false): L.DivIcon {
  const label =
    price >= 1_000_000
      ? `$${(price / 1_000_000).toFixed(1)}M`
      : `$${Math.round(price / 1_000)}K`;

  return L.divIcon({
    className: "",
    iconSize: active ? ([82, 36] as [number, number]) : ([72, 32] as [number, number]),
    iconAnchor: active ? ([41, 18] as [number, number]) : ([36, 16] as [number, number]),
    popupAnchor: [0, -20] as [number, number],
    html: `<div style="
      background:${active ? "#d6ad55" : "#0d0d0d"};
      color:${active ? "#060606" : "#fff"};
      border-radius:999px;
      padding:${active ? "7px 14px" : "6px 13px"};
      font-size:12px;
      font-weight:800;
      white-space:nowrap;
      box-shadow:${active ? "0 12px 32px rgba(6,6,6,.28),0 0 0 2px #fff" : "0 8px 24px rgba(0,0,0,0.25),0 0 0 2px rgba(255,255,255,.9)"};
      letter-spacing:0.01em;
      transform:${active ? "scale(1.06)" : "scale(1)"};
      transition:transform .2s ease, background .2s ease;
    ">${label}</div>`,
  });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);
}

interface PropertyMapProps {
  listings: Listing[];
  className?: string;
  onSelect?: (id: string) => void;
  selectedId?: string;
}

export default function PropertyMap({ listings, className = "", onSelect, selectedId }: PropertyMapProps) {
  const mappable = listings.filter((l) => l.lat != null && l.lng != null);

  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <MapContainer
        center={[45.5231, -122.6765]}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {mappable.map((l) => (
          <Marker
            key={l.id}
            position={[l.lat, l.lng]}
            icon={makePriceIcon(l.price, selectedId === l.id)}
            eventHandlers={{
              click: () => onSelect?.(l.id),
            }}
          >
            <Popup minWidth={200}>
              <div style={{ fontFamily: "inherit", padding: "2px 0" }}>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "#0d0d0d", lineHeight: 1.3 }}>{formatPrice(l.price)}</div>
                <div style={{ marginTop: "3px", fontSize: "12px", color: "#0d0d0d", opacity: 0.8, lineHeight: 1.4 }}>{l.address}</div>
                <div style={{ marginTop: "2px", fontSize: "12px", color: "#64748b" }}>
                  {l.beds} bd &middot; {l.baths} ba &middot; {l.sqft.toLocaleString()} sf
                </div>
                <Link
                  href={`/listings/${l.id}`}
                  style={{
                    display: "inline-block",
                    marginTop: "8px",
                    borderRadius: "999px",
                    background: "#0d0d0d",
                    color: "#fff",
                    padding: "4px 14px",
                    fontSize: "11px",
                    fontWeight: 600,
                    textDecoration: "none",
                    letterSpacing: "0.01em",
                  }}
                >
                  View listing →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
