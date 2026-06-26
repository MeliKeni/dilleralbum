/**
 * Script para cargar las figuritas desde config/stickers.json a Supabase.
 * Ejecutar con: npx ts-node scripts/seed-stickers.ts
 * O desde el panel de Supabase ejecutando el SQL manualmente.
 */
import { createClient } from '@supabase/supabase-js';
import stickersConfig from '../config/stickers.json';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Clave de service role (NO la anon key)
);

async function main() {
  console.log('Seeding stickers...');

  for (const s of stickersConfig.stickers) {
    const { error } = await supabase.from('stickers').upsert({
      album_id: stickersConfig.album.id,
      page_id: '00000000-0000-0000-0000-000000000010',
      sticker_number: s.number,
      name: s.displayName.toLowerCase().replace(/\s+/g, '-'),
      display_name: s.displayName,
      image_url: s.image,
      is_extra: s.isExtra,
      pos_x: s.position?.x ?? null,
      pos_y: s.position?.y ?? null,
      pos_width: s.position?.width ?? null,
      pos_height: s.position?.height ?? null,
      panoramic_group: s.panoramicGroup ?? null,
      metadata: s.metadata ?? {},
      is_active: true,
      sort_order: parseInt(s.number.replace(/\D/g, '')) || 0,
    }, { onConflict: 'album_id,sticker_number' });

    if (error) console.error(`Error seeding ${s.number}:`, error.message);
    else console.log(`✓ ${s.number} — ${s.displayName}`);
  }

  for (const e of stickersConfig.extras) {
    const { error } = await supabase.from('stickers').upsert({
      album_id: stickersConfig.album.id,
      page_id: null,
      sticker_number: e.number,
      name: e.displayName.toLowerCase().replace(/\s+/g, '-'),
      display_name: e.displayName,
      image_url: e.image,
      is_extra: true,
      pos_x: null, pos_y: null, pos_width: null, pos_height: null,
      panoramic_group: null,
      metadata: e.metadata ?? {},
      is_active: true,
      sort_order: parseInt(e.number.replace(/\D/g, '')) || 0,
    }, { onConflict: 'album_id,sticker_number' });

    if (error) console.error(`Error seeding ${e.number}:`, error.message);
    else console.log(`✓ ${e.number} — ${e.displayName} (extra)`);
  }

  console.log('Done!');
}

main().catch(console.error);
