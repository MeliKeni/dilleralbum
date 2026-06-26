# Álbum Virtual de Figuritas — Arquitectura Completa

> **Estado**: Documento de diseño. Ninguna línea de código ha sido escrita todavía.  
> **Fecha**: 2026-06-26

---

## 1. Resumen Ejecutivo

Aplicación web/móvil de álbum de figuritas virtuales, con apertura de paquetes, sistema de intercambio, panel de administración y soporte para múltiples álbumes en el futuro. El stack elegido permite desplegar hoy como web app (Vercel) y compilar mañana como app nativa (iOS / Android) sin reescribir código.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Framework UI | React Native + Expo SDK 52 | Universal (web + iOS + Android) desde un mismo código |
| Navegación | Expo Router v4 (file-based) | Rutas declarativas, soporte deep linking nativo |
| Web rendering | React Native Web | Mismo componente renderiza en browser |
| Estilos | NativeWind v4 (Tailwind CSS) | Utility-first, mobile-first, consistente en todas las plataformas |
| Lenguaje | TypeScript strict | Seguridad de tipos, refactor seguro, autocomplete |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) | BaaS completo, RLS en base de datos, Storage con permisos |
| Estado global | Zustand | Mínimo boilerplate, integración simple con React |
| Animaciones | React Native Reanimated v3 + Moti | 60fps nativo, animaciones declarativas |
| Gestos | React Native Gesture Handler | Swipe, drag para la experiencia de sobre |
| Despliegue web | Vercel (output: export de Expo) | CI/CD automático, CDN global |
| Imágenes | Expo Image (lazy loading + cache) | Optimizado para listas largas de figuritas |

### Por qué Supabase y no Firebase
- Postgres permite consultas complejas (intercambios, estadísticas)
- Row Level Security es más expresivo que Firestore rules
- Edge Functions corren en Deno, sin cold start perceptible
- Storage con políticas por bucket y path
- Open source: migración posible si escala

---

## 3. Estructura de Carpetas

```
albumdiller/
│
├── app/                            # Expo Router — cada archivo = una ruta
│   ├── _layout.tsx                 # Root layout (providers globales)
│   ├── (auth)/                     # Rutas públicas — sin tab bar
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   │
│   ├── (tabs)/                     # Rutas protegidas con tab bar
│   │   ├── _layout.tsx             # Tab navigator
│   │   ├── album/
│   │   │   ├── index.tsx           # Vista del álbum (páginas)
│   │   │   └── [pageId].tsx        # Página específica del álbum
│   │   ├── collection/
│   │   │   └── index.tsx           # Colección personal (no pegadas)
│   │   ├── packs/
│   │   │   └── index.tsx           # Abrir sobres
│   │   ├── extras/
│   │   │   └── index.tsx           # Extra stickers
│   │   └── profile/
│   │       └── index.tsx           # Perfil, stats, ajustes
│   │
│   ├── trade/                      # Intercambios
│   │   ├── index.tsx               # Lista de intercambios activos
│   │   ├── new.tsx                 # Crear propuesta
│   │   └── [tradeId].tsx           # Detalle de intercambio
│   │
│   ├── sticker/
│   │   └── [stickerId].tsx         # Vista de figurita individual (modal)
│   │
│   └── admin/                      # Panel administración
│       ├── _layout.tsx
│       ├── index.tsx               # Dashboard
│       ├── stickers/
│       │   ├── index.tsx           # Lista de figuritas
│       │   ├── new.tsx             # Agregar figurita
│       │   └── [id].tsx            # Editar figurita
│       ├── extras/
│       │   ├── index.tsx
│       │   ├── new.tsx
│       │   └── [id].tsx
│       ├── codes/
│       │   ├── index.tsx           # Lista de códigos
│       │   └── new.tsx             # Crear código
│       ├── users/
│       │   ├── index.tsx           # Lista de usuarios
│       │   └── [userId].tsx        # Detalle de usuario
│       ├── packs/
│       │   └── index.tsx           # Configuración de sobres y probabilidades
│       └── albums/
│           └── index.tsx           # Gestión de álbumes y páginas
│
├── components/
│   ├── ui/                         # Componentes base reutilizables
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Avatar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   └── ProgressBar.tsx
│   │
│   ├── sticker/
│   │   ├── StickerCard.tsx         # Tarjeta de figurita
│   │   ├── StickerSlot.tsx         # Espacio vacío en el álbum
│   │   ├── StickerGrid.tsx         # Grilla de figuritas
│   │   └── StickerDetail.tsx       # Vista detallada modal
│   │
│   ├── album/
│   │   ├── AlbumPage.tsx           # Una página del álbum
│   │   ├── AlbumCover.tsx          # Tapa
│   │   └── AlbumStats.tsx          # Estadísticas
│   │
│   ├── pack/
│   │   ├── PackCard.tsx            # Sobre cerrado
│   │   ├── PackOpeningAnimation.tsx # Animación apertura
│   │   └── PackReveal.tsx          # Revelación figurita por figurita
│   │
│   ├── trade/
│   │   ├── TradeCard.tsx           # Resumen de intercambio
│   │   └── TradeProposal.tsx       # Formulario de propuesta
│   │
│   └── admin/
│       ├── DataTable.tsx           # Tabla reutilizable
│       ├── StatsCard.tsx
│       └── ImageUploader.tsx
│
├── hooks/                          # Custom hooks
│   ├── useAuth.ts                  # Sesión y usuario actual
│   ├── useAlbum.ts                 # Estado del álbum
│   ├── useCollection.ts            # Colección del usuario
│   ├── usePacks.ts                 # Sobres disponibles y apertura
│   ├── useTrades.ts                # Intercambios
│   └── useAdmin.ts                 # Operaciones admin
│
├── lib/
│   ├── supabase.ts                 # Cliente Supabase (singleton)
│   ├── supabaseServer.ts           # Cliente server-side (sin cookie)
│   ├── constants.ts                # Constantes de la app
│   └── utils.ts                    # Utilidades generales
│
├── store/                          # Zustand stores
│   ├── authStore.ts
│   ├── albumStore.ts
│   └── uiStore.ts
│
├── types/
│   ├── database.ts                 # Tipos auto-generados de Supabase
│   ├── app.ts                      # Tipos de la aplicación
│   └── config.ts                   # Tipos del archivo de configuración
│
├── config/
│   └── stickers.json               # Configuración de figuritas (ver §8)
│
├── assets/
│   ├── covers/
│   │   ├── cover.png
│   │   └── backcover.png
│   ├── pages/
│   │   └── page1.png
│   ├── stickers/
│   │   ├── sticker001.png
│   │   └── ...
│   └── extras/
│       ├── extra001.png
│       └── ...
│
└── supabase/
    ├── migrations/                 # SQL ordenado cronológicamente
    │   ├── 001_initial_schema.sql
    │   ├── 002_rls_policies.sql
    │   └── 003_functions.sql
    └── functions/                  # Edge Functions
        ├── open-pack/
        │   └── index.ts
        ├── redeem-code/
        │   └── index.ts
        └── execute-trade/
            └── index.ts
```

---

## 4. Modelo de Base de Datos

### 4.1 Diagrama de relaciones (simplificado)

```
auth.users (Supabase)
    └── profiles (1:1)
            ├── user_stickers (1:N)  ──── stickers (N)
            ├── album_placements (1:N) ── stickers (N)
            ├── pack_claims (1:N)
            ├── code_redemptions (1:N) ── codes (N)
            ├── trades_as_proposer (1:N)
            └── trades_as_receiver (1:N)

albums (1:N) ── pages (1:N) ── stickers (N)
pack_configs (N) ── albums (N)  [many-to-one: configs pertenecen a un álbum]
```

### 4.2 Esquema SQL Detallado

```sql
-- ==========================================
-- PERFILES DE USUARIO
-- ==========================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  is_blocked      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- ÁLBUMES
-- ==========================================
CREATE TABLE albums (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,       -- 'dtf-2026'
  description     TEXT,
  cover_image_url TEXT,
  back_cover_image_url TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- PÁGINAS DEL ÁLBUM
-- ==========================================
CREATE TABLE pages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id        UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  page_number     INT NOT NULL,
  name            TEXT NOT NULL,              -- 'Argentina'
  background_image_url TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(album_id, page_number)
);

-- ==========================================
-- FIGURITAS
-- ==========================================
CREATE TYPE sticker_rarity AS ENUM ('common', 'uncommon', 'rare', 'legendary');

CREATE TABLE stickers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id        UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  page_id         UUID REFERENCES pages(id) ON DELETE SET NULL,  -- NULL = extra
  sticker_number  TEXT NOT NULL,              -- 'ARG001', 'EXT001'
  name            TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  rarity          sticker_rarity NOT NULL DEFAULT 'common',
  image_url       TEXT NOT NULL,
  is_extra        BOOLEAN NOT NULL DEFAULT FALSE,
  -- Posición en la página del álbum (porcentajes, 0-100)
  pos_x           DECIMAL(5,2),
  pos_y           DECIMAL(5,2),
  pos_width       DECIMAL(5,2),
  pos_height      DECIMAL(5,2),
  -- Metadatos extendidos (fecha de nacimiento, ciudad, etc.)
  metadata        JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(album_id, sticker_number)
);

-- ==========================================
-- FIGURITAS DEL USUARIO (inventario)
-- ==========================================
CREATE TABLE user_stickers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sticker_id      UUID NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
  quantity        INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  first_obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sticker_id)
);

-- ==========================================
-- FIGURITAS PEGADAS EN EL ÁLBUM
-- ==========================================
CREATE TABLE album_placements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sticker_id      UUID NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
  placed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sticker_id)   -- un usuario no puede pegar la misma dos veces
);

-- ==========================================
-- CONFIGURACIÓN DE SOBRES
-- ==========================================
CREATE TABLE pack_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id        UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  stickers_per_pack INT NOT NULL DEFAULT 5,
  -- Pesos de rareza: {"common": 70, "uncommon": 20, "rare": 8, "legendary": 2}
  rarity_weights  JSONB NOT NULL DEFAULT '{"common":70,"uncommon":20,"rare":8,"legendary":2}',
  -- Garantías: {"min_uncommon": 1} — al menos 1 uncommon por sobre
  guarantees      JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- SOBRES DISPONIBLES DEL USUARIO
-- ==========================================
CREATE TABLE user_packs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pack_config_id  UUID NOT NULL REFERENCES pack_configs(id),
  quantity        INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, pack_config_id)
);

-- ==========================================
-- RECLAMO DIARIO
-- ==========================================
CREATE TABLE daily_claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claimed_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  packs_given     INT NOT NULL DEFAULT 2,
  UNIQUE(user_id, claimed_date)
);

-- ==========================================
-- HISTORIAL DE APERTURA DE SOBRES
-- ==========================================
CREATE TABLE pack_openings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pack_config_id  UUID NOT NULL REFERENCES pack_configs(id),
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pack_opening_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_id      UUID NOT NULL REFERENCES pack_openings(id) ON DELETE CASCADE,
  sticker_id      UUID NOT NULL REFERENCES stickers(id),
  was_duplicate   BOOLEAN NOT NULL DEFAULT FALSE
);

-- ==========================================
-- CÓDIGOS DE CANJE
-- ==========================================
CREATE TABLE codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,
  description     TEXT,
  pack_config_id  UUID REFERENCES pack_configs(id),
  packs_amount    INT NOT NULL DEFAULT 1,
  max_uses        INT,                        -- NULL = ilimitado
  uses_count      INT NOT NULL DEFAULT 0,
  is_single_use_per_user BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at      TIMESTAMPTZ,               -- NULL = sin vencimiento
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE code_redemptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id         UUID NOT NULL REFERENCES codes(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  redeemed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(code_id, user_id)  -- aplicado solo cuando is_single_use_per_user=true
);

-- ==========================================
-- INTERCAMBIOS
-- ==========================================
CREATE TYPE trade_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled', 'expired');

CREATE TABLE trades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Lo que ofrece el proponente
  offered_sticker_id UUID NOT NULL REFERENCES stickers(id),
  -- Lo que pide a cambio
  requested_sticker_id UUID NOT NULL REFERENCES stickers(id),
  status          trade_status NOT NULL DEFAULT 'pending',
  message         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  completed_at    TIMESTAMPTZ,
  -- Snapshots de cantidades al momento de crear la propuesta
  proposer_quantity_at_creation INT NOT NULL,
  receiver_quantity_at_creation INT NOT NULL,
  CHECK (proposer_id != receiver_id),
  CHECK (offered_sticker_id != requested_sticker_id)
);

-- ==========================================
-- NOTIFICACIONES
-- ==========================================
CREATE TYPE notification_type AS ENUM (
  'trade_received', 'trade_accepted', 'trade_rejected',
  'trade_cancelled', 'packs_received', 'code_redeemed'
);

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  data            JSONB NOT NULL DEFAULT '{}',
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- ÍNDICES DE PERFORMANCE
-- ==========================================
CREATE INDEX idx_user_stickers_user_id ON user_stickers(user_id);
CREATE INDEX idx_user_stickers_sticker_id ON user_stickers(sticker_id);
CREATE INDEX idx_album_placements_user_id ON album_placements(user_id);
CREATE INDEX idx_trades_proposer ON trades(proposer_id, status);
CREATE INDEX idx_trades_receiver ON trades(receiver_id, status);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_stickers_album_page ON stickers(album_id, page_id);
CREATE INDEX idx_daily_claims_user_date ON daily_claims(user_id, claimed_date);
```

---

## 5. Flujo de Autenticación

```
1. REGISTRO
   Usuario completa form (email, password, username, display_name)
      → supabase.auth.signUp()
      → trigger DB crea fila en profiles automáticamente
      → usuario recibe email de confirmación
      → al confirmar, sesión activa

2. LOGIN
   Email + password
      → supabase.auth.signInWithPassword()
      → JWT almacenado en SecureStore (móvil) / cookie httpOnly (web)
      → Zustand authStore hidrata con usuario

3. PERSISTENCIA
   Expo Router _layout.tsx escucha supabase.auth.onAuthStateChange()
      → redirige a (auth) si sesión expiró
      → mantiene sesión hasta logout explícito

4. RECUPERACIÓN DE CONTRASEÑA
   → supabase.auth.resetPasswordForEmail()
   → link mágico llega al email
   → deep link abre la app en pantalla de nueva contraseña

5. LOGOUT
   → supabase.auth.signOut()
   → limpia Zustand store
   → redirige a /login
```

### Trigger de creación de perfil
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 6. Seguridad y Permisos (Row Level Security)

**Principio**: El cliente nunca puede confiar. Toda operación sensible va por Edge Function.

### Políticas RLS principales

```sql
-- PROFILES: cada uno ve el suyo; admins ven todos
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users read others basic info" ON profiles
  FOR SELECT USING (TRUE);  -- username y display_name son públicos
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid()));
  -- No pueden cambiar su propio is_admin

-- USER_STICKERS: solo el dueño
ALTER TABLE user_stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own stickers only" ON user_stickers
  FOR ALL USING (auth.uid() = user_id);

-- ALBUM_PLACEMENTS: solo el dueño
ALTER TABLE album_placements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own placements only" ON album_placements
  FOR ALL USING (auth.uid() = user_id);

-- TRADES: ver los propios; crear los propios; no modificar directamente
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "See own trades" ON trades
  FOR SELECT USING (auth.uid() = proposer_id OR auth.uid() = receiver_id);
-- Las mutaciones de trades van SOLO por Edge Function

-- STICKERS: todos pueden leer; solo admin puede escribir
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads stickers" ON stickers FOR SELECT USING (TRUE);
CREATE POLICY "Admin writes stickers" ON stickers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
```

### Operaciones críticas — solo via Edge Functions
| Operación | Por qué no en cliente |
|---|---|
| `open-pack` | Genera números random seguros; deduce sobre; inserta figuritas |
| `redeem-code` | Verifica validez, expiración, usos, single-use, atómica |
| `execute-trade` | Verifica inventarios, transfiere atómicamente, previene race conditions |
| `grant-packs` | Admin da sobres a usuario específico |

---

## 7. Estructura de Supabase Storage

```
Bucket: album-assets (público, solo lectura)
├── covers/
│   ├── cover.png
│   └── backcover.png
├── pages/
│   └── page1.png
├── stickers/
│   ├── sticker001.png
│   └── ...
└── extras/
    ├── extra001.png
    └── ...

Bucket: user-avatars (público, escritura restringida al dueño)
└── {userId}/avatar.png

Bucket: admin-uploads (privado, solo admins)
└── temp/...
```

### Políticas de Storage
```sql
-- album-assets: lectura pública, escritura solo admin
CREATE POLICY "Public read album assets" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'album-assets');

CREATE POLICY "Admin write album assets" ON storage.objects
  FOR INSERT TO authenticated USING (
    bucket_id = 'album-assets' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- user-avatars: lectura pública, escritura solo dueño
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'user-avatars');

CREATE POLICY "Own avatar write" ON storage.objects
  FOR ALL TO authenticated USING (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## 8. Archivo de Configuración de Figuritas

### `config/stickers.json`
```json
{
  "album": {
    "id": "dtf-2026",
    "name": "DTF International Congress 2026",
    "slug": "dtf-2026"
  },
  "packConfig": {
    "stickersPerPack": 5,
    "rarityWeights": {
      "common": 70,
      "uncommon": 20,
      "rare": 8,
      "legendary": 2
    },
    "guarantees": {
      "minUncommon": 1
    }
  },
  "pages": [
    {
      "id": "page-argentina",
      "pageNumber": 1,
      "name": "Argentina",
      "backgroundImage": "pages/page1.png"
    }
  ],
  "stickers": [
    {
      "number": "ARG001",
      "name": "melu-blum",
      "displayName": "MELU BLUM",
      "page": "page-argentina",
      "rarity": "common",
      "image": "stickers/sticker001.png",
      "isExtra": false,
      "position": { "x": 12.5, "y": 18.0, "width": 18.0, "height": 22.0 },
      "metadata": {
        "birthdate": "02-03-2010",
        "age": 16,
        "city": "Buenos Aires",
        "country": "ARG"
      }
    }
  ],
  "extras": [
    {
      "number": "EXT001",
      "name": "extra-special",
      "displayName": "Extra Special",
      "rarity": "rare",
      "image": "extras/extra001.png",
      "isExtra": true,
      "metadata": {}
    }
  ]
}
```

**Para agregar figuritas**: agregar entrada en `stickers.json` + imagen en `assets/stickers/`. Un script de seed lee este archivo y sincroniza la base de datos. El admin también puede hacerlo desde el panel web.

---

## 9. Flujo de Apertura de Paquetes

```
CLIENTE                              EDGE FUNCTION (open-pack)
─────────────────────────────────────────────────────────────
1. Usuario presiona "Abrir sobre"
2. POST /functions/v1/open-pack
   { packConfigId: "..." }
                                     3. Verifica JWT (auth.uid())
                                     4. Verifica que user_packs.quantity >= 1
                                     5. Obtiene pack_config (stickers_per_pack, weights)
                                     6. Obtiene pool de figuritas elegibles
                                        (activas, del álbum, respetando rarezas)
                                     7. Aplica garantías (min_uncommon, etc.)
                                     8. Genera lista de N figuritas random
                                     9. TRANSACCIÓN ATÓMICA:
                                        - user_packs.quantity -= 1
                                        - INSERT pack_openings
                                        - INSERT pack_opening_results
                                        - UPSERT user_stickers (quantity += 1)
                                    10. Retorna { openingId, stickers: [...] }
11. Recibe lista de figuritas
12. Inicia animación (sobre se abre)
13. Muestra figuritas una por una
14. Actualiza estado local (Zustand)
```

### Anti-abuso
- Edge Function verifica `user_packs.quantity` en DB, no en cliente
- Rate limiting: máximo 10 aperturas por minuto por usuario (via Supabase Rate Limit en Edge)
- Daily claim: Edge Function `claim-daily` con `INSERT ... ON CONFLICT DO NOTHING` sobre `daily_claims(user_id, claimed_date)` — atómico, sin duplicados

---

## 10. Sistema de Intercambio

```
ESTADO: pending → accepted/rejected/cancelled/expired

CREAR PROPUESTA:
  Validaciones (cliente + server):
  - El proponente tiene al menos 1 copia de la figurita ofrecida
  - El receptor tiene al menos 1 copia de la figurita pedida
  - No hay propuesta pendiente idéntica entre estos usuarios
  - Ambos usuarios no están bloqueados

EJECUTAR INTERCAMBIO (Edge Function execute-trade):
  TRANSACCIÓN:
  1. SELECT ... FOR UPDATE en ambos user_stickers (lock anti race condition)
  2. Verificar que ambos siguen teniendo las figuritas
  3. user_stickers[proposer][offered] -= 1
  4. user_stickers[proposer][requested] += 1
  5. user_stickers[receiver][offered] += 1
  6. user_stickers[receiver][requested] -= 1
  7. trades.status = 'accepted', completed_at = NOW()
  8. Notificación a ambos usuarios
  Si algún paso falla → ROLLBACK completo

EXPIRACIÓN:
  - Cron job diario (Supabase cron) que marca como 'expired' los trades
    con expires_at < NOW() y status = 'pending'
```

---

## 11. Panel de Administración

### Acceso
- Ruta `/admin` protegida: verifica `profiles.is_admin = TRUE` en el servidor
- El `is_admin` **nunca** se puede modificar desde el cliente (RLS lo bloquea)
- Para promover admin: query directo en Supabase Dashboard (solo una vez, al configurar)

### Funcionalidades

| Sección | Acciones |
|---|---|
| Dashboard | Total usuarios, figuritas completadas hoy, sobres abiertos, intercambios activos |
| Figuritas | CRUD completo, subida de imagen, reordenamiento, activar/desactivar |
| Extra Stickers | CRUD + subida de imagen |
| Páginas | Agregar páginas al álbum, subir background, reordenar |
| Sobres | Configurar stickers_per_pack, ajustar pesos de rareza, agregar nuevos tipos |
| Códigos | Crear, activar/desactivar, ver usos, filtrar por estado |
| Usuarios | Buscar, ver stats individuales, bloquear/desbloquear, enviar sobres, regalar figuritas |
| Intercambios | Ver todos los activos, intervenir si hay conflicto |

---

## 12. Sistema de Códigos

```
FLUJO DE CANJE (Edge Function redeem-code):
  1. Usuario ingresa código
  2. Edge Function:
     a. SELECT código (case-insensitive)
     b. Verificar is_active = TRUE
     c. Verificar expires_at IS NULL OR expires_at > NOW()
     d. Verificar max_uses IS NULL OR uses_count < max_uses
     e. Si is_single_use_per_user: verificar que no hay code_redemptions del user
     f. TRANSACCIÓN:
        - codes.uses_count += 1
        - INSERT code_redemptions
        - user_packs.quantity += packs_amount (UPSERT)
        - Notificación al usuario
  3. Retorna resultado al cliente
```

---

## 13. Diseño Visual

### Paleta de colores (inferida de las imágenes)
```
Primary:    #1B4FD8  (azul FIFA)
Secondary:  #3BBFBF  (teal/turquesa)
Accent:     #E8A020  (dorado/naranja)
Surface:    #F5F7FA  (gris muy claro)
Background: #FFFFFF
Text:       #0D1B2A  (casi negro)
TextMuted:  #6B7280
Error:      #DC2626
Success:    #16A34A
```

### Tipografía
- Títulos: fuente bold que imite el estilo de los números "26" del álbum
- Cuerpo: System font (San Francisco en iOS, Roboto en Android, system-ui en web)

### Componentes clave de UX
- Tab bar con íconos grandes, Mobile First
- Animación de apertura de sobre: flip card + partículas + revelación secuencial
- Al pegar figurita: animación de "caída" + brillo + feedback háptico
- Skeleton loading en todos los listados
- Pull-to-refresh en colección y álbum

---

## 14. Despliegue

### Web (Vercel)
```bash
# Build command
npx expo export -p web

# Output directory
dist/
```

Variables de entorno en Vercel:
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### Móvil (futuro)
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

Sin cambios de código — solo agregar `app.json` con bundle ID y configurar EAS.

---

## 15. Escalabilidad y Expansión Futura

### Agregar nuevo álbum
1. INSERT en tabla `albums`
2. INSERT páginas y figuritas (o via panel admin)
3. Sin cambios de código

### Agregar nueva página
1. Subir imagen al Storage
2. INSERT en `pages` con posición
3. Actualizar `stickers.json` (o via panel admin)

### Agregar nuevas rarezas
1. ALTER TYPE sticker_rarity ADD VALUE '...'
2. Actualizar pack_config rarity_weights

### Agregar nuevo tipo de sobre (semanal, especial)
1. INSERT en pack_configs
2. Ya aparece como opción

### Agregar sistema de puntos/logros
- Tablas adicionales, sin romper las existentes
- Edge Functions nuevas

---

## 16. Preguntas Abiertas

Antes de escribir código necesito que confirmes:

**P1. Figuritas y contenido**
- ¿Cuántas figuritas tiene el álbum principal actualmente? ¿Cuántas extras?
- ¿Cuáles son las rarezas que querés usar? (¿common/rare/legendary, o tenés otros nombres?)

**P2. Sistema de sobres**
- ¿Cuántos sobres diarios recibe cada usuario (mencionaste 2, ¿confirmo)?
- ¿Cuántas figuritas por sobre?

**P3. Supabase**
- ¿Ya tenés un proyecto de Supabase creado? ¿O lo creamos desde cero?

**P4. Nombre de usuario y colores**
- ¿El álbum se llama "DTF International Congress 2026" o tiene otro nombre público?
- ¿Confirmás la paleta de colores que inferí de las imágenes o tenés una oficial?

**P5. Perfil de usuario**
- ¿Los usuarios pueden subir foto de perfil?
- ¿Necesitás login con Google/redes sociales, o solo email+contraseña?

**P6. Intercambio**
- ¿El intercambio es 1:1 (una figurita por una), o puede ser N:M?
- ¿Los extras también se pueden intercambiar?

**P7. Admin**
- ¿El primer admin lo configuramos manualmente en Supabase o querés un flujo especial?

---

*Documento listo para revisión. Una vez confirmadas las preguntas de la sección 16, empezamos a generar el código.*
