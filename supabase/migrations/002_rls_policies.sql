-- ============================================================
-- ROW LEVEL SECURITY — Todas las tablas protegidas
-- El cliente NUNCA puede mutar datos sensibles directamente.
-- Las operaciones críticas van por Edge Functions (SECURITY DEFINER).
-- ============================================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Impide que el usuario cambie su propio is_admin o is_blocked
    AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())
    AND is_blocked = (SELECT is_blocked FROM profiles WHERE id = auth.uid())
  );

-- ALBUMS (lectura pública, escritura solo admin via service role)
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "albums_select_active" ON albums FOR SELECT USING (is_active = TRUE);
CREATE POLICY "albums_admin_all" ON albums FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- PAGES
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pages_select_all" ON pages FOR SELECT USING (TRUE);
CREATE POLICY "pages_admin_all" ON pages FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- STICKERS (lectura pública, escritura solo admin)
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stickers_select_active" ON stickers FOR SELECT USING (is_active = TRUE);
CREATE POLICY "stickers_admin_all" ON stickers FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- USER_STICKERS (solo el dueño y admins)
ALTER TABLE user_stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_stickers_own" ON user_stickers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_stickers_admin" ON user_stickers
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
-- Escritura SOLO via Edge Functions (no hay política de INSERT/UPDATE/DELETE para usuarios)

-- ALBUM_PLACEMENTS
ALTER TABLE album_placements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "placements_select_own" ON album_placements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "placements_insert_own" ON album_placements
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM user_stickers us
      WHERE us.user_id = auth.uid()
        AND us.sticker_id = album_placements.sticker_id
        AND us.quantity > 0
    )
  );
CREATE POLICY "placements_admin" ON album_placements
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- PACK_CONFIGS (lectura pública)
ALTER TABLE pack_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pack_configs_select" ON pack_configs FOR SELECT USING (is_active = TRUE);
CREATE POLICY "pack_configs_admin" ON pack_configs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- USER_PACKS (solo el dueño — escritura via Edge Functions)
ALTER TABLE user_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_packs_own" ON user_packs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_packs_admin" ON user_packs
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- DAILY_CLAIMS (solo el dueño)
ALTER TABLE daily_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_claims_own" ON daily_claims
  FOR SELECT USING (auth.uid() = user_id);

-- PACK_OPENINGS (solo el dueño)
ALTER TABLE pack_openings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pack_openings_own" ON pack_openings
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE pack_opening_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pack_opening_results_own" ON pack_opening_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM pack_openings po WHERE po.id = opening_id AND po.user_id = auth.uid())
  );

-- CODES (lectura limitada — el usuario no puede ver todos los códigos)
ALTER TABLE codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "codes_admin_all" ON codes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
-- Los usuarios solo pueden consultar códigos via Edge Function (no pueden listarlos todos)

ALTER TABLE code_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "code_redemptions_own" ON code_redemptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "code_redemptions_admin" ON code_redemptions
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- TRADES
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trades_see_own" ON trades
  FOR SELECT USING (auth.uid() = proposer_id OR auth.uid() = receiver_id);
CREATE POLICY "trades_admin" ON trades
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

ALTER TABLE trade_offered_stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_offered_own" ON trade_offered_stickers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trades t
      WHERE t.id = trade_id AND (t.proposer_id = auth.uid() OR t.receiver_id = auth.uid())
    )
  );

ALTER TABLE trade_requested_stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_requested_own" ON trade_requested_stickers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trades t
      WHERE t.id = trade_id AND (t.proposer_id = auth.uid() OR t.receiver_id = auth.uid())
    )
  );

-- NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (auth.uid() = user_id);
