-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Trigger: crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: updated_at automático en profiles
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER user_stickers_updated_at
  BEFORE UPDATE ON user_stickers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER user_packs_updated_at
  BEFORE UPDATE ON user_packs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Función: marcar trades expirados (llamada por cron job)
CREATE OR REPLACE FUNCTION expire_old_trades()
RETURNS void AS $$
BEGIN
  UPDATE trades
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: estadísticas del usuario (usada en el perfil)
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_total_stickers INT;
  v_placed_stickers INT;
  v_extra_stickers INT;
  v_total_album_slots INT;
  v_total_extras INT;
  v_duplicates INT;
  v_packs_opened INT;
BEGIN
  SELECT COUNT(*) INTO v_total_album_slots
  FROM stickers s
  JOIN albums a ON a.id = s.album_id
  WHERE s.is_extra = FALSE AND s.is_active = TRUE AND a.is_active = TRUE;

  SELECT COUNT(*) INTO v_total_extras
  FROM stickers s
  JOIN albums a ON a.id = s.album_id
  WHERE s.is_extra = TRUE AND s.is_active = TRUE AND a.is_active = TRUE;

  SELECT COUNT(*) INTO v_placed_stickers
  FROM album_placements WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(CASE WHEN s.is_extra = TRUE THEN us.quantity ELSE 0 END), 0)
  INTO v_extra_stickers
  FROM user_stickers us
  JOIN stickers s ON s.id = us.sticker_id
  WHERE us.user_id = p_user_id AND us.quantity > 0;

  SELECT COALESCE(SUM(GREATEST(us.quantity - 1, 0)), 0)
  INTO v_duplicates
  FROM user_stickers us
  WHERE us.user_id = p_user_id;

  SELECT COUNT(*) INTO v_packs_opened
  FROM pack_openings WHERE user_id = p_user_id;

  RETURN json_build_object(
    'total_album_slots', v_total_album_slots,
    'placed_stickers', v_placed_stickers,
    'completion_pct', CASE WHEN v_total_album_slots > 0
      THEN ROUND((v_placed_stickers::numeric / v_total_album_slots) * 100, 1)
      ELSE 0 END,
    'total_extras_slots', v_total_extras,
    'extras_collected', v_extra_stickers,
    'duplicates', v_duplicates,
    'packs_opened', v_packs_opened
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage buckets (ejecutar desde el Supabase Dashboard o via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('album-assets', 'album-assets', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-avatars', 'user-avatars', true);

-- Seed inicial: álbum y página de Argentina
INSERT INTO albums (id, name, slug, description, is_active, sort_order)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Official Sticker Album DTF',
  'dtf-2026',
  'DTF International Congress 2026 - We Are 26',
  TRUE,
  1
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO pages (id, album_id, page_number, name, background_image_url)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  1,
  'Argentina',
  'pages/page1.png'
) ON CONFLICT (album_id, page_number) DO NOTHING;

INSERT INTO pack_configs (id, album_id, name, stickers_per_pack, include_extras, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000001',
  'Sobre Estándar',
  5,
  TRUE,
  TRUE
) ON CONFLICT DO NOTHING;
