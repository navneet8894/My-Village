import { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { api } from '../api';

export default function NewsScreen() {
  const token = useSelector((s) => s.auth.token);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api('/news', { token });
        setItems(data);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.author}>{item.userId?.name}</Text>
          {item.kind === 'text' && <Text>{item.text}</Text>}
          {item.mediaUrl && item.kind === 'photo' && (
            <Image source={{ uri: item.mediaUrl }} style={styles.img} resizeMode="cover" />
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  author: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  img: { width: '100%', height: 180, borderRadius: 8, marginTop: 8 },
});
