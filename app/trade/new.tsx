import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, Alert
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useAlbumStore } from '@/store/albumStore';
import { StickerCard } from '@/components/sticker/StickerCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Sticker, Profile } from '@/types/app';
import { ALBUM_ID } from '@/lib/constants';

type Step = 'select_receiver' | 'select_offered' | 'select_requested' | 'confirm';

export default function NewTradeScreen() {
  const { user } = useAuthStore();
  const { stickers, userStickers, setStickers, setUserStickers } = useAlbumStore();
  const [step, setStep] = useState<Step>('select_receiver');
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [receiver, setReceiver] = useState<Profile | null>(null);
  const [receiverStickers, setReceiverStickers] = useState<Map<string, number>>(new Map());
  const [offered, setOffered] = useState<Map<string, number>>(new Map()); // sticker_id -> qty
  const [requested, setRequested] = useState<Map<string, number>>(new Map());
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!stickers.length) fetchStickers();
    if (!userStickers.size) fetchUserStickers();
  }, []);

  async function fetchStickers() {
    const { data } = await supabase.from('stickers').select('*').eq('album_id', ALBUM_ID).eq('is_active', true);
    if (data) setStickers(data);
  }

  async function fetchUserStickers() {
    if (!user) return;
    const { data } = await supabase.from('user_stickers').select('*').eq('user_id', user.id);
    if (data) setUserStickers(data);
  }

  async function searchUsers(q: string) {
    setUserSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .ilike('username', `%${q}%`)
      .neq('id', user!.id)
      .eq('is_blocked', false)
      .limit(10);
    setSearchResults((data ?? []) as Profile[]);
    setSearching(false);
  }

  async function selectReceiver(p: Profile) {
    setReceiver(p);
    const { data } = await supabase.from('user_stickers').select('*').eq('user_id', p.id);
    const map = new Map(data?.map((s) => [s.sticker_id, s.quantity]) ?? []);
    setReceiverStickers(map);
    setStep('select_offered');
  }

  function toggleOffered(stickerId: string) {
    const qty = userStickers.get(stickerId) ?? 0;
    if (qty < 1) return;
    const cur = new Map(offered);
    if (cur.has(stickerId)) cur.delete(stickerId);
    else cur.set(stickerId, 1);
    setOffered(cur);
  }

  function toggleRequested(stickerId: string) {
    const qty = receiverStickers.get(stickerId) ?? 0;
    if (qty < 1) return;
    const cur = new Map(requested);
    if (cur.has(stickerId)) cur.delete(stickerId);
    else cur.set(stickerId, 1);
    setRequested(cur);
  }

  async function submitTrade() {
    if (!receiver || !user) return;
    setLoading(true);
    try {
      const { data: trade, error } = await supabase
        .from('trades')
        .insert({ proposer_id: user.id, receiver_id: receiver.id, message: message || null })
        .select('id')
        .single();
      if (error) throw error;

      if (offered.size > 0) {
        await supabase.from('trade_offered_stickers').insert(
          Array.from(offered.entries()).map(([sticker_id, quantity]) => ({
            trade_id: trade.id, sticker_id, quantity,
          }))
        );
      }
      if (requested.size > 0) {
        await supabase.from('trade_requested_stickers').insert(
          Array.from(requested.entries()).map(([sticker_id, quantity]) => ({
            trade_id: trade.id, sticker_id, quantity,
          }))
        );
      }

      // Notificar al receptor
      await supabase.from('notifications').insert({
        user_id: receiver.id,
        type: 'trade_received',
        title: '¡Nueva propuesta de intercambio!',
        body: `${user.email} te propuso un intercambio`,
        data: { trade_id: trade.id },
      });

      Alert.alert('¡Listo!', 'Tu propuesta de intercambio fue enviada', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  const myOwnedStickers = useMemo(
    () => stickers.filter((s) => (userStickers.get(s.id) ?? 0) > 0),
    [stickers, userStickers]
  );

  const receiverOwnedStickers = useMemo(
    () => stickers.filter((s) => (receiverStickers.get(s.id) ?? 0) > 0),
    [stickers, receiverStickers]
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-2xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1">Nuevo intercambio</Text>
      </View>

      {/* Steps indicator */}
      <View className="flex-row gap-1 px-4 py-3 bg-white">
        {(['select_receiver', 'select_offered', 'select_requested', 'confirm'] as Step[]).map((s, i) => (
          <View key={s} className={`flex-1 h-1.5 rounded-full ${step === s ? 'bg-primary' : steps.indexOf(step) > i ? 'bg-primary/40' : 'bg-gray-200'}`} />
        ))}
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {step === 'select_receiver' && (
          <View className="p-4 gap-4">
            <Text className="text-lg font-bold text-gray-900">¿Con quién querés intercambiar?</Text>
            <Input
              placeholder="Buscar por nombre de usuario..."
              value={userSearch}
              onChangeText={searchUsers}
              autoCapitalize="none"
            />
            {searching && <LoadingSpinner />}
            {searchResults.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => selectReceiver(p)}
                className="bg-white rounded-2xl p-4 flex-row items-center gap-3"
                style={{ elevation: 1 }}
              >
                <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
                  <Text className="font-bold text-primary">{p.display_name[0]}</Text>
                </View>
                <View>
                  <Text className="font-semibold text-gray-900">{p.display_name}</Text>
                  <Text className="text-xs text-gray-400">@{p.username}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 'select_offered' && (
          <View className="p-4 gap-4">
            <Text className="text-lg font-bold text-gray-900">¿Qué ofrecés? ({offered.size} seleccionadas)</Text>
            <Text className="text-xs text-gray-500">Tocá las figuritas que querés ofrecer. Podés no ofrecer nada (regalo).</Text>
            {myOwnedStickers.length === 0 ? (
              <Text className="text-gray-400 text-center py-8">No tenés figuritas para ofrecer</Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {myOwnedStickers.map((s) => (
                  <TouchableOpacity key={s.id} onPress={() => toggleOffered(s.id)}>
                    <StickerCard
                      sticker={s}
                      quantity={userStickers.get(s.id) ?? 0}
                      dimmed={false}
                      size="sm"
                    />
                    {offered.has(s.id) && (
                      <View className="absolute inset-0 rounded-xl border-2 border-primary bg-primary/10 items-center justify-center">
                        <Text className="text-primary font-black text-lg">✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Button
              title={`Continuar (${offered.size} seleccionadas)`}
              onPress={() => setStep('select_requested')}
            />
          </View>
        )}

        {step === 'select_requested' && (
          <View className="p-4 gap-4">
            <Text className="text-lg font-bold text-gray-900">¿Qué pedís? ({requested.size} seleccionadas)</Text>
            <Text className="text-xs text-gray-500">Figuritas de {receiver?.display_name}. Podés no pedir nada.</Text>
            {receiverOwnedStickers.length === 0 ? (
              <Text className="text-gray-400 text-center py-8">{receiver?.display_name} no tiene figuritas disponibles</Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {receiverOwnedStickers.map((s) => (
                  <TouchableOpacity key={s.id} onPress={() => toggleRequested(s.id)}>
                    <StickerCard sticker={s} quantity={receiverStickers.get(s.id) ?? 0} size="sm" />
                    {requested.has(s.id) && (
                      <View className="absolute inset-0 rounded-xl border-2 border-secondary bg-secondary/10 items-center justify-center">
                        <Text className="text-secondary font-black text-lg">✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Button title={`Continuar`} onPress={() => setStep('confirm')} />
          </View>
        )}

        {step === 'confirm' && (
          <View className="p-4 gap-4">
            <Text className="text-lg font-bold text-gray-900">Confirmar intercambio</Text>
            <View className="bg-white rounded-2xl p-4 gap-3" style={{ elevation: 1 }}>
              <Text className="font-semibold text-gray-700">Con: {receiver?.display_name}</Text>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Ofrecés ({offered.size})</Text>
                  {offered.size === 0 ? (
                    <Text className="text-xs text-gray-400 italic">Nada (regalo)</Text>
                  ) : (
                    Array.from(offered.keys()).map((id) => {
                      const s = stickers.find((st) => st.id === id);
                      return <Text key={id} className="text-xs text-gray-700">• {s?.display_name}</Text>;
                    })
                  )}
                </View>
                <Text className="text-xl">⇄</Text>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Pedís ({requested.size})</Text>
                  {requested.size === 0 ? (
                    <Text className="text-xs text-gray-400 italic">Nada</Text>
                  ) : (
                    Array.from(requested.keys()).map((id) => {
                      const s = stickers.find((st) => st.id === id);
                      return <Text key={id} className="text-xs text-gray-700">• {s?.display_name}</Text>;
                    })
                  )}
                </View>
              </View>
            </View>
            <Input
              label="Mensaje (opcional)"
              placeholder="Hola, ¿intercambiamos?"
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <Button title="Enviar propuesta" onPress={submitTrade} loading={loading} size="lg" />
            <Button title="Atrás" variant="ghost" onPress={() => setStep('select_requested')} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const steps: Step[] = ['select_receiver', 'select_offered', 'select_requested', 'confirm'];
