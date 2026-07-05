import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { api } from '../api';

export default function MapScreen() {
  const [center, setCenter] = useState({ latitude: 20.5937, longitude: 78.9629 });
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await api('/public/map-config');
        setCenter({
          latitude: cfg.defaultCenter.lat,
          longitude: cfg.defaultCenter.lng,
        });
        const events = await api('/events');
        setMarkers(
          events
            .filter((e) => e.location?.lat && e.location?.lng)
            .map((e) => ({
              id: e._id,
              title: e.title,
              coordinate: { latitude: e.location.lat, longitude: e.location.lng },
            }))
        );
      } catch {
        /* use defaults */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <MapView style={styles.flex} initialRegion={{ ...center, latitudeDelta: 0.08, longitudeDelta: 0.08 }}>
        <Marker coordinate={center} title="Village" />
        {markers.map((m) => (
          <Marker key={m.id} coordinate={m.coordinate} title={m.title} />
        ))}
      </MapView>
      <Text style={styles.hint}>Configure GOOGLE_MAPS_API_KEY on server for web; native maps use device/OS.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: { position: 'absolute', bottom: 8, left: 8, right: 8, fontSize: 11, color: '#fff', backgroundColor: 'rgba(0,0,0,0.45)', padding: 6, borderRadius: 6 },
});
