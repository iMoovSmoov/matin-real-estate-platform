"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import type { Listing } from "@/lib/types";

function makePriceIcon(price: number): L.DivIcon {
  const label =
    price >= 1_000_000
      ? `$${(price / 1_000_000).toFixed(1)}M`
      : `$${Math.round(price / 1_000)}K`;

  return L.divIcon({
    className: "",
    iconSize: [66, 30] as [number, number],
    iconAnchor: [33, 15] as [number, number],
    popupAnchor: [0, -20] as [number, number],
    html: `<div style="background:#0d0d0d;color:#fff;border-radius:999px;padding:5px 12px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.35);letter-spacing:0.02em">${label}</div>`,
  });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);
}

interface PropertyMapProps {
  listings: Listing[];
  className?: string;
  onSelect?: (id: string) => void;
}

export default function PropertyMap({ listings, className = "", onSelect }: PropertyMapProps) {
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
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappable.map((l) => (
          <Marker
            key={l.id}
            position={[l.lat, l.lng]}
            icon={makePriceIcon(l.price)}
            eventHandlers={{
              click: () => onSelect?.(l.id),
            }}
          >
            <Popup>
              <div className="min-w-[180px] space-y-1 text-sm">
                <div className="font-semibold text-gray-900">{l.address}</div>
                <div className="font-bold text-gray-800">{formatPrice(l.price)}</div>
                <div className="text-gray-500">
                  {l.beds} bd · {l.baths} ba
                </div>
                <Link
                  href={`/listings/${l.id}`}
                  className="mt-1.5 inline-block rounded-full bg-gray-900 px-3 py-1 text-[0.75rem] font-semibold text-white hover:bg-gray-700"
                >
                  View listing
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
