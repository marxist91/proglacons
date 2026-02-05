'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
// Leaflet CSS is loaded via link in layout or head

// Fix for default markers in Leaflet with webpack
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons
const createCustomIcon = (color: string, size: number = 40) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

const createHQIcon = () => {
  return L.divIcon({
    className: 'hq-marker',
    html: `
      <div style="
        width: 50px;
        height: 50px;
        background-color: #00ADEF;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 20px rgba(0,173,239,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" fill="white" />
        </svg>
      </div>
      <div style="
        position: absolute;
        top: 55px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 900;
        font-size: 10px;
        color: #00ADEF;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ">PRO-GLAÇONS</div>
    `,
    iconSize: [50, 70],
    iconAnchor: [25, 25],
    popupAnchor: [0, -30]
  });
};

const createOrderIcon = () => {
  return L.divIcon({
    className: 'order-marker',
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background-color: #EF4444;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(239,68,68,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: bounce 1s infinite;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none" />
          <circle cx="12" cy="12" r="3" fill="white" />
        </svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -20]
  });
};

const createZonePolygon = (color: string) => ({
  color: color,
  weight: 2,
  opacity: 0.8,
  fillColor: color,
  fillOpacity: 0.2
});

interface DriverLocation {
  id: string;
  name: string;
  phone: string;
  lat: number;
  lng: number;
  status: 'available' | 'delivering' | 'returning' | 'offline';
  currentOrderId?: string;
  currentOrderAddress?: string;
}

interface OrderLocation {
  id: string;
  customerName: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
}

interface DeliveryZone {
  id: string;
  name: string;
  color: string;
  neighborhoods: string[];
  coordinates: [number, number][];
}

interface DeliveryMapProps {
  drivers: DriverLocation[];
  orders: OrderLocation[];
  zones: DeliveryZone[];
  mapView: 'drivers' | 'zones' | 'orders';
  onDriverClick?: (driver: DriverLocation) => void;
  onOrderClick?: (order: OrderLocation) => void;
  onZoneClick?: (zone: DeliveryZone) => void;
  hqPosition?: [number, number];
}

// Lomé zones coordinates (approximate polygons)
const ZONE_COORDINATES: Record<string, [number, number][]> = {
  'centre': [
    [6.1400, 1.2000],
    [6.1400, 1.2400],
    [6.1700, 1.2400],
    [6.1700, 1.2000],
  ],
  'nord': [
    [6.1700, 1.1800],
    [6.1700, 1.2500],
    [6.2100, 1.2500],
    [6.2100, 1.1800],
  ],
  'sud': [
    [6.1100, 1.2000],
    [6.1100, 1.2400],
    [6.1400, 1.2400],
    [6.1400, 1.2000],
  ],
  'est': [
    [6.1100, 1.2800],
    [6.1100, 1.3400],
    [6.1500, 1.3400],
    [6.1500, 1.2800],
  ],
  'ouest': [
    [6.1100, 1.1600],
    [6.1100, 1.2000],
    [6.1500, 1.2000],
    [6.1500, 1.1600],
  ],
};

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  drivers,
  orders,
  zones,
  mapView,
  onDriverClick,
  onOrderClick,
  onZoneClick,
  hqPosition = [6.1725, 1.2314] // PRO-GLAÇONS HQ in Lomé
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map centered on Lomé
    const map = L.map(mapContainerRef.current, {
      center: hqPosition,
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Create a layer group for markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Add HQ marker
    L.marker(hqPosition, { icon: createHQIcon() })
      .addTo(map)
      .bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <strong style="color: #00ADEF; font-size: 14px;">PRO-GLAÇONS</strong>
          <p style="margin: 4px 0 0; font-size: 12px; color: #666;">Siège Social</p>
          <p style="margin: 2px 0 0; font-size: 11px; color: #999;">Lomé, Togo</p>
        </div>
      `);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [hqPosition]);

  // Update markers when data changes
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    const markersLayer = markersLayerRef.current;

    // Clear existing markers from the layer
    markersLayer.clearLayers();

    // Add zones if in zones view
    if (mapView === 'zones') {
      zones.forEach((zone) => {
        const coords = ZONE_COORDINATES[zone.id];
        if (coords) {
          const polygon = L.polygon(coords, createZonePolygon(zone.color))
            .addTo(markersLayer)
            .bindPopup(`
              <div style="padding: 8px;">
                <strong style="color: ${zone.color}; font-size: 14px;">${zone.name}</strong>
                <p style="margin: 4px 0 0; font-size: 12px;">${zone.neighborhoods.length} quartiers</p>
              </div>
            `);
          
          if (onZoneClick) {
            polygon.on('click', () => onZoneClick(zone));
          }
        }
      });
    }

    // Add driver markers
    if (mapView === 'drivers' || mapView === 'orders') {
      drivers.forEach((driver) => {
        const statusColors: Record<string, string> = {
          'available': '#10B981',
          'delivering': '#3B82F6',
          'returning': '#F59E0B',
          'offline': '#6B7280'
        };
        
        const statusLabels: Record<string, string> = {
          'available': 'Disponible',
          'delivering': 'En livraison',
          'returning': 'En retour',
          'offline': 'Hors ligne'
        };

        const marker = L.marker([driver.lat, driver.lng], {
          icon: createCustomIcon(statusColors[driver.status] || '#6B7280')
        })
          .addTo(markersLayer)
          .bindPopup(`
            <div style="padding: 8px; min-width: 150px;">
              <strong style="font-size: 14px;">${driver.name}</strong>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">${driver.phone}</p>
              <span style="
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                background: ${statusColors[driver.status]}20;
                color: ${statusColors[driver.status]};
              ">${statusLabels[driver.status]}</span>
              ${driver.currentOrderAddress ? `
                <p style="margin-top: 8px; font-size: 11px; color: #666;">
                  📦 ${driver.currentOrderAddress}
                </p>
              ` : ''}
            </div>
          `);

        if (onDriverClick) {
          marker.on('click', () => onDriverClick(driver));
        }
      });
    }

    // Add order markers
    if (mapView === 'orders') {
      orders.forEach((order) => {
        const marker = L.marker([order.lat, order.lng], {
          icon: createOrderIcon()
        })
          .addTo(markersLayer)
          .bindPopup(`
            <div style="padding: 8px; min-width: 150px;">
              <strong style="font-size: 14px;">${order.customerName}</strong>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">📍 ${order.address}</p>
              <span style="
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                background: #FEF3C7;
                color: #D97706;
              ">${order.status}</span>
            </div>
          `);

        if (onOrderClick) {
          marker.on('click', () => onOrderClick(order));
        }
      });
    }

  }, [drivers, orders, zones, mapView, hqPosition, onDriverClick, onOrderClick, onZoneClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full rounded-xl" />
      
      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
        }
        .leaflet-popup-tip {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
        .custom-marker, .hq-marker, .order-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-slate-700 z-[1000]">
        <p className="text-xs font-bold text-slate-400 mb-2">Légende</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-white">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-white">En livraison</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-white">En retour</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-white">Commande</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#00ADEF]" />
            <span className="text-xs text-white">PRO-GLAÇONS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMap;
