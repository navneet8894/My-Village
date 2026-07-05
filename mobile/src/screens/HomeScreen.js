import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../api';
import { logout } from '../store';
import VillageSetupModal from '../components/VillageSetupModal';

export default function HomeScreen({ navigation }) {
  const user = useSelector((s) => s.auth.user);
  const token = useSelector((s) => s.auth.token);
  const dispatch = useDispatch();
  const [modalOpen, setModalOpen] = useState(false);
  const [villageData, setVillageData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadVillage() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api('/villages/me', { token });
      setVillageData(data);
    } catch {
      setVillageData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVillage();
  }, [token, user?.villageId]);

  useEffect(() => {
    if (!user?.villageId && !loading) {
      setModalOpen(true);
    }
  }, [user?.villageId, loading]);

  const hasVillage = user?.villageId || villageData?.village;
  const members = villageData?.members || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.brand}>MY VILLAGE</Text>
      <View style={styles.row}>
        <Text style={styles.hi}>Hello, {user?.name}</Text>
        {!hasVillage && (
          <TouchableOpacity style={styles.villageBtn} onPress={() => setModalOpen(true)}>
            <Text style={styles.villageBtnText}>Add village</Text>
          </TouchableOpacity>
        )}
      </View>

      {!hasVillage && (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Add your village to connect</Text>
          <Text style={styles.bannerSub}>
            Select country, state, district, and village. Users in the same village see each other.
          </Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={() => setModalOpen(true)}>
            <Text style={styles.bannerBtnText}>Add your village</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasVillage && villageData?.village && (
        <View style={styles.villageCard}>
          <Text style={styles.villageName}>{villageData.village.name}</Text>
          <Text style={styles.villageLoc}>
            {villageData.village.district}, {villageData.village.state}
          </Text>
          <Text style={styles.membersTitle}>Villagers ({members.length})</Text>
          {loading ? (
            <ActivityIndicator color="#059669" />
          ) : (
            members.map((m) => (
              <View key={m._id} style={styles.memberRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{m.name?.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.memberName}>
                    {m.name}
                    {m._id === user?._id ? ' (you)' : ''}
                  </Text>
                  <Text style={styles.memberEmail}>{m.email}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {[
        ['Events', 'Events'],
        ['News', 'News'],
        ['Map', 'Map'],
        ['Notifications', 'Notifications'],
      ].map(([label, screen]) => (
        <TouchableOpacity key={screen} style={styles.card} onPress={() => navigation.navigate(screen)}>
          <Text style={styles.cardText}>{label}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.outline} onPress={() => dispatch(logout())}>
        <Text style={styles.outlineText}>Log out</Text>
      </TouchableOpacity>

      <VillageSetupModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => loadVillage()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  brand: { fontSize: 14, fontWeight: '700', color: '#047857', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hi: { fontSize: 20, fontWeight: '700', flex: 1 },
  villageBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  villageBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  banner: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 8,
  },
  bannerTitle: { fontWeight: '700', color: '#047857', fontSize: 16 },
  bannerSub: { fontSize: 13, color: '#64748b', marginTop: 6 },
  bannerBtn: {
    backgroundColor: '#059669',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  bannerBtnText: { color: '#fff', fontWeight: '600' },
  villageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  villageName: { fontSize: 18, fontWeight: '700', color: '#047857' },
  villageLoc: { fontSize: 13, color: '#64748b', marginTop: 4 },
  membersTitle: { fontWeight: '600', marginTop: 14, marginBottom: 8 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '700', color: '#047857' },
  memberName: { fontWeight: '600' },
  memberEmail: { fontSize: 12, color: '#94a3b8' },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardText: { fontSize: 16, fontWeight: '600' },
  outline: { marginTop: 24, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  outlineText: { textAlign: 'center', color: '#64748b', fontWeight: '600' },
});
