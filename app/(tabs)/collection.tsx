import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAlbumStore } from '@/store/albumStore';
import { StickerCard } from '@/components/sticker/StickerCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { CollectionFilter, Sticker } from '@/types/app';
import { ALBUM_ID } from '@/lib/constants';

const FILTERS: { key: CollectionFilter; label: string; color: string }[] = [
  { key: 'all', label: 'Todas', color: '#6366F1' },
  { key: 'not_placed', label: 'Sin pegar ⭐', color: '#F59E0B' },
  { key: 'duplicates', label: 'Repetidas', color: '#EF4444' },
  { key: 'extras', label: 'Extras', color: '#10B981' },
];

export default function CollectionScreen() {
  const { user } = useAuthStore();
  const { stickers, userStickers, placements, setStickers, setUserStickers, setPlacements, addPlacement } = useAlbumStore();
  const [filter, setFilter] = useState<CollectionFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    if (!user) return;
    setLoading(true);
    const [{ data: s }, { data: us }, { data: pl }] = await Promise.all([
      supabase.from('stickers').select('*').eq('album_id', ALBUM_ID).eq('is_active', true).order('sort_order'),
      supabase.from('user_stickers').select('*').eq('user_id', user.id),
      supabase.from('album_placements').select('*').eq('user_id', user.id),
    ]);
    if (s) setStickers(s);
    if (us) setUserStickers(us);
    if (pl) setPlacements(pl);
    setLoading(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  async function handlePaste(sticker: Sticker) {
    setSelectedSticker(null);
    const { error } = await supabase.from('album_placements')
      .insert({ user_id: user!.id, sticker_id: sticker.id });
    if (!error) {
      addPlacement(sticker.id);
      Alert.alert('✓ Figurita pegada', `${sticker.display_name} está en tu álbum`);
    }
  }

  const ownedStickers = useMemo(() =>
    stickers.filter((s) => (userStickers.get(s.id) ?? 0) > 0),
    [stickers, userStickers]);

  const filtered = useMemo(() => {
    let list = ownedStickers;
    if (filter === 'not_placed') list = list.filter((s) => !placements.has(s.id) && !s.is_extra);
    else if (filter === 'duplicates') list = list.filter((s) => (userStickers.get(s.id) ?? 0) > 1);
    else if (filter === 'extras') list = list.filter((s) => s.is_extra);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.display_name.toLowerCase().includes(q) || s.sticker_number.toLowerCase().includes(q));
    }
    return list;
  }, [ownedStickers, filter, search, placements, userStickers]);

  if (loading) return <LoadingSpinner fullScreen label="Cargando colección..." />;

  const activeFilter = FILTERS.find((f) => f.key === filter)!;

  return (
    <View style={{ flex: 1, backgroundColor: '#1E1B4B' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* HEADER */}
        <LinearGradient
          colors={['#4C1D95', '#6D28D9', '#1E1B4B']}
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 3 }}>
            DTF 2026
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginTop: 2 }}>
            MIS FIGURITAS
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 }}>
            {ownedStickers.length} figuritas · {filtered.length} mostradas
          </Text>

          {/* Buscador */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14,
            paddingHorizontal: 14, height: 44, marginTop: 16,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', marginRight: 8 }}>🔍</Text>
            <TextInput
              style={{ flex: 1, color: '#FFFFFF', fontSize: 14 }}
              placeholder="Buscar figurita..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </LinearGradient>

        {/* FILTROS */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                backgroundColor: filter === f.key ? f.color : 'rgba(255,255,255,0.08)',
                borderWidth: 1, borderColor: filter === f.key ? f.color : 'rgba(255,255,255,0.1)',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: filter === f.key ? '800' : '500' }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* GRID */}
        {filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800' }}>Sin figuritas aquí</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', paddingHorizontal: 32 }}>
              {search ? 'Probá con otro término' : 'Abrí sobres para conseguir figuritas'}
            </Text>
            {!search && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/packs')}
                style={{ backgroundColor: '#6D28D9', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>Abrir sobres →</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
            columnWrapperStyle={{ gap: 12, justifyContent: 'flex-start' }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A78BFA" />}
            renderItem={({ item }) => (
              <StickerCard
                sticker={item}
                quantity={userStickers.get(item.id) ?? 0}
                isPlaced={placements.has(item.id)}
                isNew={!placements.has(item.id) && !item.is_extra}
                onPress={() => setSelectedSticker(item)}
                size="md"
              />
            )}
          />
        )}

        {/* MODAL acción figurita */}
        <Modal visible={!!selectedSticker} transparent animationType="slide" onRequestClose={() => setSelectedSticker(null)}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
            activeOpacity={1}
            onPress={() => setSelectedSticker(null)}
          >
            <View style={{ backgroundColor: '#1E1B4B', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, gap: 16 }}>
              {selectedSticker && (
                <>
                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: '800', letterSpacing: 1 }}>
                      {selectedSticker.sticker_number}
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900' }}>
                      {selectedSticker.display_name}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                      Tenés {userStickers.get(selectedSticker.id) ?? 0} · {placements.has(selectedSticker.id) ? '✓ Pegada en álbum' : 'Sin pegar'}
                    </Text>
                  </View>

                  {!placements.has(selectedSticker.id) && !selectedSticker.is_extra && (
                    <TouchableOpacity
                      onPress={() => handlePaste(selectedSticker)}
                      style={{ backgroundColor: '#10B981', borderRadius: 18, padding: 18, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>📖 Pegar en el álbum</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => { setSelectedSticker(null); router.push('/trade/new'); }}
                    style={{ backgroundColor: '#F59E0B', borderRadius: 18, padding: 18, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#000', fontSize: 16, fontWeight: '800' }}>⇄ Agregar a intercambio</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { setSelectedSticker(null); router.push(`/sticker/${selectedSticker.id}`); }}
                    style={{ padding: 12, alignItems: 'center' }}
                  >
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Ver detalle →</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
