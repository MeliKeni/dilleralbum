import { Tabs, Redirect } from 'expo-router';
import { View, Text } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const TAB_BG = '#0D1117';
const TAB_ACTIVE = '#3B82F6';
const TAB_INACTIVE = '#4B5563';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 4, paddingTop: 8 }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
      <Text style={{
        fontSize: 10,
        fontWeight: focused ? '700' : '500',
        color: focused ? TAB_ACTIVE : TAB_INACTIVE,
        letterSpacing: 0.3,
      }}>
        {label}
      </Text>
      {focused && (
        <View style={{
          position: 'absolute', bottom: -8, width: 20, height: 2,
          backgroundColor: TAB_ACTIVE, borderRadius: 1,
        }} />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { user, isLoading } = useAuthStore();
  const unread = useUIStore((s) => s.unreadNotifications);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: TAB_BG,
          borderTopWidth: 1,
          borderTopColor: '#1F2937',
          height: 72,
          paddingBottom: 10,
          paddingTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="album"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📖" label="ÁLBUM" focused={focused} /> }}
      />
      <Tabs.Screen
        name="collection"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="✦" label="COLECCIÓN" focused={focused} /> }}
      />
      <Tabs.Screen
        name="packs"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="◈" label="SOBRES" focused={focused} /> }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          tabBarIcon: ({ focused }) => (
            <View>
              <TabIcon icon="⇄" label="CAMBIO" focused={focused} />
              {unread > 0 && (
                <View style={{
                  position: 'absolute', top: 6, right: -2,
                  backgroundColor: '#EF4444', borderRadius: 8,
                  width: 15, height: 15, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#fff', fontSize: 8, fontWeight: '800' }}>
                    {unread > 9 ? '9+' : unread}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="◎" label="PERFIL" focused={focused} /> }}
      />
    </Tabs>
  );
}
