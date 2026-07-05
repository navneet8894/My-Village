import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useGetMapConfigQuery, useGetEventsQuery } from '../app/apiSlice';

const mapContainerStyle = { width: '100%', height: '420px', borderRadius: '12px' };

export default function MapPage() {
  const user = useSelector((s) => s.auth.user);
  const { data: cfg } = useGetMapConfigQuery();
  const { data: events } = useGetEventsQuery();

  const center = useMemo(() => {
    const vl = user?.villageLocation;
    if (vl?.lat && vl?.lng) return { lat: vl.lat, lng: vl.lng };
    return {
      lat: cfg?.defaultCenter?.lat ?? 20.5937,
      lng: cfg?.defaultCenter?.lng ?? 78.9629,
    };
  }, [user, cfg]);

  const apiKey = cfg?.googleMapsApiKey;

  if (!apiKey) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Village map</h1>
        <p className="mt-2 text-slate-500">
          Set <code className="text-sm bg-slate-100 dark:bg-slate-800 px-1 rounded">GOOGLE_MAPS_API_KEY</code> on
          the API server (see <code>.env.example</code>) and restart. Use a browser-restricted key.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Village map</h1>
      <p className="text-slate-500 text-sm mt-1">
        {user?.villageLocation?.label || 'Your village center and event pins.'}
      </p>
      <div className="mt-4 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <LoadScript googleMapsApiKey={apiKey}>
          <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={13}>
            <Marker position={center} label="V" title={user?.villageLocation?.village || 'Village center'} />
            {(events || [])
              .filter((e) => e.location?.lat && e.location?.lng)
              .map((e) => (
                <Marker
                  key={e._id}
                  position={{ lat: e.location.lat, lng: e.location.lng }}
                  title={e.title}
                />
              ))}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
}
