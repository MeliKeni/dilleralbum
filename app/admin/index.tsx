import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface DashStats {
  total_users: number;
  total_stickers: number;
  total_codes: number;
  total_trades: number;
  packs_opened_today: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    const today = new Date().toISOString().split('T')[0];
    const [
      { count: users },
      { count: stickers },
      { count: codes },
      { count: trades },
      { count: packs },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('stickers').select('*', { count: 'exact', head: true }),
      supabase.from('codes').select('*', { count: 'exact', head: true }),
      supabase.from('trades').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('pack_openings').select('*', { count: 'exact', head: true }).gte('opened_at', today),
    ]);
    setStats({
      total_users: users ?? 0,
      total_stickers: stickers ?? 0,
      total_codes: codes ?? 0,
      total_trades: trades ?? 0,
      packs_opened_today: packs ?? 0,
    });
    setLoading(false);
  }

  if (loading) return <LoadingSpinner fullScreen />;

  const sections = [
    { emoji: '⭐', label: 'Figuritas', desc: 'Agregar y editar', route: '/admin/stickers' },
    { emoji: '✨', label: 'Extra Stickers', desc: 'Agregar extras', route: '/admin/extras/new' },
    { emoji: '🎟', label: 'Códigos', desc: 'Crear y gestionar', route: '/admin/codes' },
    { emoji: '👥', label: 'Usuarios', desc: 'Ver y gestionar', route: '/admin/users' },
    { emoji: '📦', label: 'Sobres', desc: 'Configurar probabilidades', route: '/admin/packs' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <LinearGradient colors={['#0D1B2A', '#1B4FD8']} className="px-4 py-5">
        <Text className="text-white text-xl font-black">Panel Admin</Text>
        <Text className="text-white/60 text-xs">Official Sticker Album DTF</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Stats */}
        {stats && (
          <View className="bg-white rounded-2xl p-4" style={{ elevation: 2 }}>
            <Text className="font-bold text-gray-800 mb-3">Resumen</Text>
            <View className="flex-row flex-wrap gap-3">
              <StatChip label="Usuarios" value={stats.total_users} color="#1B4FD8" />
              <StatChip label="Figuritas" value={stats.total_stickers} color="#3BBFBF" />
              <StatChip label="Intercambios activos" value={stats.total_trades} color="#E8A020" />
              <StatChip label="Sobres hoy" value={stats.packs_opened_today} color="#7C3AED" />
              <StatChip label="Códigos" value={stats.total_codes} color="#059669" />
            </View>
          </View>
        )}

        {/* Navegación */}
        <Text className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-1">Gestión</Text>
        <View className="gap-3">
          {sections.map((s) => (
            <TouchableOpacity
              key={s.route}
              onPress={() => router.push(s.route as any)}
              className="bg-white rounded-2xl p-4 flex-row items-center gap-4"
              activeOpacity={0.85}
              style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4 }}
            >
              <Text className="text-3xl">{s.emoji}</Text>
              <View className="flex-1">
                <Text className="font-bold text-gray-900">{s.label}</Text>
                <Text className="text-xs text-gray-500">{s.desc}</Text>
              </View>
              <Text className="text-gray-300 text-xl">›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className="bg-gray-50 rounded-xl px-3 py-2 gap-0.5" style={{ minWidth: '45%', flex: 1 }}>
      <Text className="text-lg font-black" style={{ color }}>{value}</Text>
      <Text className="text-xs text-gray-400">{label}</Text>
    </View>
  );
}
