import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/bright';

function popupContent(title, subtitle) {
  const wrap = document.createElement('div');
  wrap.className = 'village-map-popup';
  const heading = document.createElement('strong');
  heading.textContent = title;
  wrap.appendChild(heading);
  if (subtitle) { const detail = document.createElement('span'); detail.textContent = subtitle; wrap.appendChild(detail); }
  return wrap;
}

export default function VillageMap({ center, villageName = 'Village centre', events = [], draggable = false, onCenterChange, height = 480, zoom = 14 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const villageMarkerRef = useRef(null);
  const eventMarkersRef = useRef([]);
  const changeHandlerRef = useRef(onCenterChange);
  changeHandlerRef.current = onCenterChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const map = new maplibregl.Map({ container: containerRef.current, style: STYLE_URL, center: [center.lng, center.lat], zoom, attributionControl: false });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ center: [center.lng, center.lat], zoom, duration: 700 });
    villageMarkerRef.current?.remove();
    const marker = new maplibregl.Marker({ color: '#df6744', draggable })
      .setLngLat([center.lng, center.lat])
      .setPopup(new maplibregl.Popup({ offset: 26 }).setDOMContent(popupContent(villageName, draggable ? 'Drag this marker to set the exact centre' : 'Village centre')))
      .addTo(map);
    if (draggable) marker.on('dragend', () => { const point = marker.getLngLat(); changeHandlerRef.current?.({ lat: Number(point.lat.toFixed(6)), lng: Number(point.lng.toFixed(6)) }); });
    villageMarkerRef.current = marker;
    return () => marker.remove();
  }, [center.lat, center.lng, villageName, draggable, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    eventMarkersRef.current.forEach((marker) => marker.remove());
    eventMarkersRef.current = events.filter((event) => Number.isFinite(Number(event.location?.lat)) && Number.isFinite(Number(event.location?.lng))).map((event) => {
      const date = event.date ? new Date(event.date).toLocaleString('en-IN') : '';
      return new maplibregl.Marker({ color: '#397057', scale: 0.8 }).setLngLat([Number(event.location.lng), Number(event.location.lat)]).setPopup(new maplibregl.Popup({ offset: 22 }).setDOMContent(popupContent(event.title || 'Village event', [date, event.place].filter(Boolean).join(' · ')))).addTo(map);
    });
    return () => eventMarkersRef.current.forEach((marker) => marker.remove());
  }, [events]);

  return <div ref={containerRef} className="village-map" style={{ height }} aria-label={`${villageName} map`} />;
}
