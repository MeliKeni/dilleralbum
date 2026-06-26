-- ============================================================
-- ÁLBUM VIRTUAL DTF — Schema inicial
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PERFILES (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  is_blocked    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÁLBUMES
-- ============================================================
CREATE TABLE albums (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  slug                 TEXT UNIQUE NOT NULL,
  description          TEXT,
  cover_image_url      TEXT,
  back_cover_image_url TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order           INT NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PÁGINAS DEL ÁLBUM
-- ============================================================
CREATE TABLE pages (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id             UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  page_number          INT NOT NULL,
  name                 TEXT NOT NULL,
  background_image_url TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(album_id, page_number)
);

-- ============================================================
-- FIGURITAS
-- ============================================================
CREATE TABLE stickers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id       UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  page_id        UUID REFERENCES pages(id) ON DELETE SET NULL,
  sticker_number TEXT NOT NULL,
  name           TEXT NOT NULL,
  display_name   TEXT NOT NULL,
  image_url      TEXT NOT NULL DEFAULT '',
  is_extra       BOOLEAN NOT NULL DEFAULT FALSE,
  -- Posición en la página (porcentajes 0-100 sobre la imagen de fondo)
  pos_x          DECIMAL(6,3),
  pos_y          DECIMAL(6,3),
  pos_width      DECIMAL(6,3),
  pos_height     DECIMAL(6,3),
  -- Para figuritas panorámicas que forman una foto entre dos
  panoramic_group TEXT,
  -- Metadatos libres (birthdate, city, etc.)
  metadata       JSONB NOT NULL DEFAULT '{}',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(album_id, sticker_number)
);

-- ============================================================
-- INVENTARIO DE FIGURITAS DEL USUARIO
-- ============================================================
CREATE TABLE user_stickers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sticker_id        UUID NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
  quantity          INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  first_obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sticker_id)
);

-- ============================================================
-- FIGURITAS PEGADAS EN EL ÁLBUM
-- ============================================================
CREATE TABLE album_placements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sticker_id UUID NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
  placed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sticker_id)
);

-- ============================================================
-- CONFIGURACIÓN DE SOBRES
-- ============================================================
CREATE TABLE pack_configs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id          UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  stickers_per_pack INT NOT NULL DEFAULT 5,
  -- Incluye extras en el pool?
  include_extras    BOOLEAN NOT NULL DEFAULT TRUE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SOBRES DISPONIBLES POR USUARIO
-- ============================================================
CREATE TABLE user_packs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pack_config_id UUID NOT NULL REFERENCES pack_configs(id),
  quantity       INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, pack_config_id)
);

-- ============================================================
-- RECLAMO DIARIO
-- ============================================================
CREATE TABLE daily_claims (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claimed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  packs_given  INT NOT NULL DEFAULT 2,
  UNIQUE(user_id, claimed_date)
);

-- ============================================================
-- HISTORIAL DE APERTURA DE SOBRES
-- ============================================================
CREATE TABLE pack_openings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pack_config_id UUID NOT NULL REFERENCES pack_configs(id),
  opened_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pack_opening_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_id   UUID NOT NULL REFERENCES pack_openings(id) ON DELETE CASCADE,
  sticker_id   UUID NOT NULL REFERENCES stickers(id),
  was_duplicate BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================================
-- CÓDIGOS DE CANJE
-- ============================================================
CREATE TABLE codes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  TEXT UNIQUE NOT NULL,
  description           TEXT,
  pack_config_id        UUID REFERENCES pack_configs(id),
  packs_amount          INT NOT NULL DEFAULT 1,
  max_uses              INT,
  uses_count            INT NOT NULL DEFAULT 0,
  is_single_use_per_user BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at            TIMESTAMPTZ,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_by            UUID NOT NULL REFERENCES profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE code_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id     UUID NOT NULL REFERENCES codes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(code_id, user_id)
);

-- ============================================================
-- INTERCAMBIOS
-- ============================================================
CREATE TYPE trade_status AS ENUM (
  'pending', 'accepted', 'rejected', 'cancelled', 'expired'
);

CREATE TABLE trades (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       trade_status NOT NULL DEFAULT 'pending',
  message      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  completed_at TIMESTAMPTZ,
  CHECK (proposer_id != receiver_id)
);

-- Lo que el proponente ofrece (puede estar vacío = regalo)
CREATE TABLE trade_offered_stickers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id   UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  sticker_id UUID NOT NULL REFERENCES stickers(id),
  quantity   INT NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

-- Lo que el proponente pide a cambio (puede estar vacío = regalo)
CREATE TABLE trade_requested_stickers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id   UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  sticker_id UUID NOT NULL REFERENCES stickers(id),
  quantity   INT NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

-- ============================================================
-- NOTIFICACIONES
-- ============================================================
CREATE TYPE notification_type AS ENUM (
  'trade_received', 'trade_accepted', 'trade_rejected',
  'trade_cancelled', 'packs_received', 'code_redeemed',
  'sticker_gifted'
);

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}',
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_user_stickers_user_id ON user_stickers(user_id);
CREATE INDEX idx_user_stickers_sticker_id ON user_stickers(sticker_id);
CREATE INDEX idx_album_placements_user_id ON album_placements(user_id);
CREATE INDEX idx_trades_proposer ON trades(proposer_id, status);
CREATE INDEX idx_trades_receiver ON trades(receiver_id, status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_stickers_album_page ON stickers(album_id, page_id);
CREATE INDEX idx_daily_claims_user_date ON daily_claims(user_id, claimed_date);
CREATE INDEX idx_pack_openings_user ON pack_openings(user_id, opened_at DESC);
CREATE INDEX idx_stickers_is_extra ON stickers(album_id, is_extra);
