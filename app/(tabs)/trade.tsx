import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { TradeCard } from '@/components/trade/TradeCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { TradeWithDetails, TradeStatus } from '@/types/app';

const TABS: { key: TradeStatus | 'all'; label: string }[] = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'accepted', label: 'Completados' },
  { key: 'all', label: 'Todos' },
];

export default function TradeScreen() {
  const { user } = useAuthStore();
  const { setUnreadNotifications } = useUIStore();
  const [trades, setTrades] = useState<TradeWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState<TradeStatus | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchTrades(); }, []);

  async function fetchTrades() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('trades')
      .select(`*, proposer:profiles!trades_proposer_id_fkey(id,username,display_name,avatar_url), receiver:profiles!trades_receiver_id_fkey(id,username,display_name,avatar_url), trade_offered_stickers(*,sticker:stickers(*)), trade_requested_stickers(*,sticker:stickers(*))`)
      .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      setTrades(data.map((t: any) => ({
        ...t,
        offered_stickers: t.trade_offered_stickers.map((i: any) => ({ ...i.sticker, quantity: i.quantity })),
        requested_stickers: t.trade_requested_stickers.map((i: any) => ({ ...i.sticker, quantity: i.quantity })),
      })) as TradeWithDetails[]);
    }
    setLoading(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrades();
    setRefreshing(false);
  }, []);

  const filtered = activeTab === 'all' ? trades : trades.filter((t) => t.status === activeTab);

  if (loading) return <LoadingSpinner fullScreen label="Cargando intercambios..." />;

  return (
    <View style={{ flex: 1, backgroundColor: '#022C22' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* HEADER */}
        <LinearGradient
          colors={['#064E3B', '#065F46', '#022C22']}
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 3 }}>
            DTF 2026
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginTop: 2 }}>
            ZONA DE{'\n'}INTERCAMBIOS
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>
            Intercambiá figuritas con otros usuarios
          </Text>
        </LinearGradient>

        {/* INFO BOX */}
        <View style={{
          marginHorizontal: 16, marginTop: -12, marginBottom: 16,
          backgroundColor: 'rgba(255,255,255,0.07)',
          borderRadius: 16, padding: 16,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
          flexDirection: 'row', gap: 12, alignItems: 'flex-start',
        }}>
          <Text style={{ fontSize: 18 }}>ⓘ</Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, flex: 1, lineHeight: 20 }}>
            Creá solicitudes ofreciendo figuritas repetidas y seleccionando las que necesitás. Puede llevar un tiempo encontrar coincidencia.
          </Text>
        </View>

        {/* BOTÓN CREAR + TABS */}
        <View style={{ paddingHorizontal: 16, gap: 12, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => router.push('/trade/new')}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#84CC16',
              borderRadius: 20, height: 64,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
              shadowColor: '#84CC16', shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
            }}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900', lineHeight: 28 }}>+</Text>
            </View>
            <Text style={{ color: '#000000', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 }}>
              CREAR SOLICITUD DE INTERCAMBIO
            </Text>
          </TouchableOpacity>

          {/* Tabs */}
          <View style={{
            flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 14, padding: 4,
          }}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                  backgroundColor: activeTab === tab.key ? '#10B981' : 'transparent',
                }}
              >
                <Text style={{
                  color: activeTab === tab.key ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                  fontSize: 13, fontWeight: activeTab === tab.key ? '800' : '500',
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* LISTA */}
        {filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Text style={{ fontSize: 48 }}>🔄</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800' }}>Sin intercambios</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', paddingHorizontal: 32 }}>
              Creá tu primera solicitud para intercambiar figuritas con otros jugadores
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
            renderItem={({ item }) => (
              <TradeCard trade={item} onPress={() => router.push(`/trade/${item.id}`)} />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
