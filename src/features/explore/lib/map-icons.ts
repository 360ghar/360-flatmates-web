import L from "leaflet";
import type { MapCluster, MapPin } from "@/lib/api/types";
import { formatRentShort } from "@/lib/utils/format";

/* Map markers are Leaflet divIcons (HTML outside React). They are paper tags
   styled by the .map-pin / .map-cluster rules in globals.css. The data-*
   attributes let MapView forward Enter and Space from the keyboard. */

export function createPinIcon(pin: MapPin): L.DivIcon {
  const flatmate = pin.mode === "co_hunter";
  const label = flatmate ? "Flatmate" : formatRentShort(pin.monthly_rent);
  const width = flatmate ? 76 : 56;
  return L.divIcon({
    html: `<div class="map-pin${flatmate ? " map-pin--flatmate" : ""}" data-pin-id="${pin.id}" role="button" tabindex="0" aria-label="${
      flatmate ? "Flatmate looking for a place" : `Room for ${label} a month`
    }">${label}</div>`,
    className: "",
    iconSize: [width, 28],
    iconAnchor: [width / 2, 14]
  });
}

export function createClusterIcon(cluster: MapCluster): L.DivIcon {
  const size = cluster.count >= 100 ? 48 : cluster.count >= 10 ? 40 : 34;
  const flatmatesOnly = (cluster.type_breakdown?.co_hunter ?? 0) > 0 && !(cluster.type_breakdown?.room_available ?? 0);
  return L.divIcon({
    html: `<div class="map-cluster${flatmatesOnly ? " map-cluster--flatmates" : ""}" data-cluster-id="${cluster.id}" role="button" tabindex="0" aria-label="${cluster.count} places here. Zoom in." style="width:${size}px;height:${size}px">${cluster.count}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}
