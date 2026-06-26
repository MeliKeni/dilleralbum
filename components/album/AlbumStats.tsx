import { View, Text } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { UserStats } from '@/types/app';

interface AlbumStatsProps {
  stats: UserStats;
}

export function AlbumStats({ stats }: AlbumStatsProps) {
  return (
    <View className="bg-white rounded-2xl p-4 gap-4 mx-4 mb-4" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 }}>
      <ProgressBar
        progress={stats.completion_pct}
        label="Progreso del álbum"
        showPercent
      />
      <View className="flex-row justify-between">
        <StatItem label="Pegadas" value={`${stats.placed_stickers}/${stats.total_album_slots}`} color="text-primary" />
        <StatItem label="Extras" value={`${stats.extras_collected}/${stats.total_extras_slots}`} color="text-secondary" />
        <StatItem label="Repetidas" value={String(stats.duplicates)} color="text-accent" />
        <StatItem label="Sobres" value={String(stats.packs_opened)} color="text-gray-600" />
      </View>
    </View>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className="items-center gap-0.5">
      <Text className={`text-lg font-bold ${color}`}>{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  );
}
