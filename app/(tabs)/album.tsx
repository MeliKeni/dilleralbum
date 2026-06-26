import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity, Alert, RefreshControl, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, getImageUrl } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAlbumStore } from '@/store/albumStore';
import { StickerSlot } from '@/components/sticker/StickerSlot';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ALBUM_ID, PAGE_ID } from '@/lib/constants';
import type { Sticker, UserStats } from '@/types/app';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type ScreenView = 'lobby' | 'album';

export default function AlbumScreen() {
  const { user, profile } = useAuthStore();
  const { stickers, userStickers, placements, setStickers, setUserStickers, setPlacements, addPlacement } = useAlbumStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<ScreenView>('lobby');
  const [pageRatio, setPageRatio] = useState(0.75);

  const albumStickers = stickers.filter((s) => !s.is_extra && s.page_id === PAGE_ID);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    if (!user) return;
    setLoading(true);
    await Promise.all([fetchStickers(), fetchUserData(), fetchStats()]);
    setLoading(false);
  }

  async function fetchStickers() {
    const { data } = await supabase.from('stickers').select('*')
      .eq('album_id', ALBUM_ID).eq('is_active', true).order('sort_order');
    if (data) setStickers(data);
  }

  async function fetchUserData() {
    if (!user) return;
    const [{ data: us }, { data: pl }] = await Promise.all([
      supabase.from('user_stickers').select('*').eq('user_id', user.id),
      supabase.from('album_placements').select('*').eq('user_id', user.id),
    ]);
    if (us) setUserStickers(us);
    if (pl) setPlacements(pl);
  }

  async function fetchStats() {
    if (!user) return;
    const { data } = await supabase.rpc('get_user_stats', { p_user_id: user.id });
    if (data) setStats(data as UserStats);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  async function handleStickerPress(sticker: Sticker) {
    const isPlaced = placements.has(sticker.id);
    const qty = userStickers.get(sticker.id) ?? 0;
    if (!isPlaced && qty === 0) { router.push(`/sticker/${sticker.id}`); return; }
    if (isPlaced) { router.push(`/sticker/${sticker.id}`); return; }
    Alert.alert('Pegar figurita', `¿Pegás "${sticker.display_name}" en tu álbum?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Pegar ✓', onPress: async () => {
          const { error } = await supabase.from('album_placements')
            .insert({ user_id: user!.id, sticker_id: sticker.id });
          if (!error) { addPlacement(sticker.id); fetchStats(); }
        },
      },
    ]);
  }

  if (loading) return <LoadingSpinner fullScreen label="Cargando álbum..." />;

  if (view === 'album') {
    return <AlbumPageView
      stickers={albumStickers}
      userStickers={userStickers}
      placements={placements}
      pageRatio={pageRatio}
      setPageRatio={setPageRatio}
      onStickerPress={handleStickerPress}
      onBack={() => setView('lobby')}
      stats={stats}
    />;
  }

  // ── LOBBY ──
  const completion = stats?.completion_pct ?? 0;
  const packs = stats?.packs_opened ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* SKY BACKGROUND */}
          <LinearGradient
            colors={['#C8E6FF', '#E8D5FF', '#F5C6E0', '#FFD4A0']}
            locations={[0, 0.35, 0.65, 1]}
            start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
            style={{ minHeight: SCREEN_H * 0.9, paddingBottom: 40 }}
          >
            {/* TOP BAR */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.4)', letterSpacing: 2 }}>DTF 2026</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1a1a2e' }}>
                  Hola, {profile?.display_name?.split(' ')[0] ?? 'jugador'} 👋
                </Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
              }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#1B4FD8' }}>{completion}% completo</Text>
              </View>
            </View>

            {/* MAIN STAGE — items flotando */}
            <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 24 }}>

              {/* TOP ACTIONS */}
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 28 }}>
                <ActionBubble label="MIS FIGURITAS" onPress={() => router.push('/(tabs)/collection')} />
                <ActionBubble label="CÓDIGO PROMO" onPress={() => router.push('/codes')} />
              </View>

              {/* ALBUM CENTRAL */}
              <View style={{ alignItems: 'center' }}>
                <View style={{
                  position: 'absolute', top: -8,
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
                  zIndex: 10,
                }}>
                  <Text style={{ fontWeight: '800', color: '#1a1a2e', fontSize: 13, letterSpacing: 1 }}>MI ÁLBUM</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setView('album')}
                  activeOpacity={0.9}
                  style={{
                    width: 190,
                    height: 260,
                    borderRadius: 16,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 20 },
                    shadowOpacity: 0.4,
                    shadowRadius: 30,
                    elevation: 20,
                    marginTop: 20,
                  }}
                >
                  <LinearGradient
                    colors={['#1B4FD8', '#0F2060']}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}
                  >
                    <Text style={{ color: 'rgba(255,255,255,0.15)', fontSize: 80, fontWeight: '900', position: 'absolute', bottom: 10, right: 10 }}>26</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 8 }}>OFFICIAL</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900', textAlign: 'center', lineHeight: 26 }}>WE{'\n'}ARE{'\n'}26</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, marginTop: 8, letterSpacing: 2 }}>STICKER ALBUM</Text>

                    {/* Progress pill */}
                    <View style={{ position: 'absolute', bottom: 16, left: 12, right: 12 }}>
                      <View style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, height: 6 }}>
                        <View style={{ width: `${completion}%`, height: 6, backgroundColor: '#3B82F6', borderRadius: 8 }} />
                      </View>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, textAlign: 'center', marginTop: 4 }}>
                        {stats?.placed_stickers ?? 0}/{stats?.total_album_slots ?? 22} figuritas
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={{
                  marginTop: 12,
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  borderRadius: 20, paddingHorizontal: 20, paddingVertical: 6,
                }}>
                  <Text style={{ fontWeight: '700', color: '#1a1a2e', fontSize: 12 }}>Toca para abrir →</Text>
                </View>
              </View>

              {/* BOTTOM ACTIONS */}
              <View style={{ flexDirection: 'row', gap: 20, marginTop: 32 }}>
                <PackBubble
                  label="ABRIR SOBRES"
                  packs={stats?.packs_opened ?? 0}
                  onPress={() => router.push('/(tabs)/packs')}
                />
                <ActionBubble label="INTERCAMBIAR" onPress={() => router.push('/(tabs)/trade')} />
              </View>
            </View>

            {/* STATS ROW */}
            <View style={{
              marginHorizontal: 20,
              backgroundColor: 'rgba(255,255,255,0.6)',
              borderRadius: 20,
              padding: 16,
              flexDirection: 'row',
              justifyContent: 'space-around',
            }}>
              {[
                { label: 'Pegadas', value: `${stats?.placed_stickers ?? 0}/${stats?.total_album_slots ?? 22}` },
                { label: 'Extras', value: `${stats?.extras_collected ?? 0}` },
                { label: 'Repetidas', value: `${stats?.duplicates ?? 0}` },
                { label: 'Sobres', value: `${stats?.packs_opened ?? 0}` },
              ].map((s, i) => (
                <View key={i} style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#1a1a2e' }}>{s.value}</Text>
                  <Text style={{ fontSize: 10, color: 'rgba(0,0,0,0.5)', fontWeight: '600', marginTop: 2 }}>{s.label.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Bubble helpers ──

function ActionBubble({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12,
        alignItems: 'center', minWidth: 110,
        shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.95)',
      }}
    >
      <Text style={{ fontWeight: '800', color: '#1a1a2e', fontSize: 11, letterSpacing: 0.5, textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function PackBubble({ label, packs, onPress }: { label: string; packs: number; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={['#EF4444', '#B91C1C']}
        style={{
          borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12,
          alignItems: 'center', minWidth: 130,
          shadowColor: '#EF4444', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
        }}
      >
        <Text style={{ fontWeight: '800', color: '#FFFFFF', fontSize: 11, letterSpacing: 0.5 }}>{label}</Text>
        {packs === 0 && (
          <View style={{
            backgroundColor: '#FDE047', borderRadius: 10,
            paddingHorizontal: 8, paddingVertical: 2, marginTop: 6,
          }}>
            <Text style={{ fontSize: 9, fontWeight: '800', color: '#1a1a2e' }}>¡2 GRATIS DISPONIBLES!</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Album Page View ──

function AlbumPageView({
  stickers, userStickers, placements, pageRatio, setPageRatio,
  onStickerPress, onBack, stats,
}: {
  stickers: Sticker[];
  userStickers: Map<string, number>;
  placements: Set<string>;
  pageRatio: number;
  setPageRatio: (r: number) => void;
  onStickerPress: (s: Sticker) => void;
  onBack: () => void;
  stats: UserStats | null;
}) {
  const pageUrl = getImageUrl('pages/page1.png');
  const PAGE_W = Math.min(SCREEN_W, 900);
  const PAGE_H = PAGE_W * pageRatio;

  return (
    <View style={{ flex: 1, backgroundColor: '#1a0a2e' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
        }}>
          <TouchableOpacity onPress={onBack} style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center', justifyContent: 'center', marginRight: 14,
          }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900' }}>Argentina</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
              {stats?.placed_stickers ?? 0}/{stats?.total_album_slots ?? 22} figuritas pegadas
            </Text>
          </View>
          <View style={{
            backgroundColor: '#3B82F6', borderRadius: 12,
            paddingHorizontal: 12, paddingVertical: 6,
          }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
              {stats?.completion_pct ?? 0}%
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ margin: 12, borderRadius: 20, overflow: 'hidden' }}>
            <View style={{ width: PAGE_W - 24, height: stickers.length > 0 ? PAGE_H : 400 }}>
              {pageUrl ? (
                <Image
                  source={{ uri: pageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  onLoad={(e) => {
                    const { width, height } = e.source;
                    if (width && height) setPageRatio(height / width);
                  }}
                />
              ) : (
                <LinearGradient
                  colors={['#1B4FD8', '#0F2060']}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}
                >
                  <Text style={{ fontSize: 80, fontWeight: '900', color: 'rgba(255,255,255,0.1)' }}>26</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900' }}>Argentina</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Subí la imagen desde el Admin</Text>
                </LinearGradient>
              )}

              {stickers.map((sticker) => {
                if (sticker.pos_x == null || sticker.pos_y == null ||
                  sticker.pos_width == null || sticker.pos_height == null) return null;
                const W = PAGE_W - 24;
                return (
                  <StickerSlot
                    key={sticker.id}
                    sticker={sticker}
                    isPlaced={placements.has(sticker.id)}
                    canPlace={(userStickers.get(sticker.id) ?? 0) > 0 && !placements.has(sticker.id)}
                    onPress={onStickerPress}
                    style={{
                      left: (W * sticker.pos_x) / 100,
                      top: (PAGE_H * sticker.pos_y) / 100,
                      width: (W * sticker.pos_width) / 100,
                      height: (PAGE_H * sticker.pos_height) / 100,
                    }}
                  />
                );
              })}
            </View>
          </View>

          {/* Navigation */}
          <View style={{ flexDirection: 'row', marginHorizontal: 12, gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 22 }}>‹</Text>
            </View>
            <View style={{ flex: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>ARGENTINA</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 22 }}>›</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
