# Guía de Setup — Official Sticker Album DTF

## 1. Crear proyecto en Supabase

1. Ir a https://supabase.com y crear una cuenta
2. Crear nuevo proyecto (nombre: `albumdtf`)
3. Guardar la **URL** y **anon key** del proyecto

## 2. Variables de entorno

Crear el archivo `.env.local` en la raíz del proyecto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key  # Solo para scripts, nunca en la app
```

## 3. Ejecutar migraciones en Supabase

En el **SQL Editor** de Supabase, ejecutar en orden:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_functions_triggers.sql`

## 4. Crear Storage Buckets

En el panel de Supabase → Storage → Create bucket:

- `album-assets` → **Public** ✓
- `user-avatars` → **Public** ✓

## 5. Configurar Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear proyecto → Credentials → OAuth 2.0 Client IDs
3. Agregar Authorized redirect URIs:
   ```
   https://TU-PROYECTO.supabase.co/auth/v1/callback
   ```
4. En Supabase → Authentication → Providers → Google:
   - Pegar **Client ID** y **Client Secret**
   - Activar Google provider

## 6. Subir imágenes

Subir las imágenes al bucket `album-assets` con esta estructura:
```
covers/
  cover.png
  backcover.png
pages/
  page1.png
stickers/
  sticker001.png
  sticker002.png
  ... (hasta sticker022.png)
extras/
  extra001.png
  extra002.png
  extra003.png
  extra004.png
```

## 7. Cargar figuritas en la base de datos

```bash
# Instalar ts-node si no lo tenés
npm install -D ts-node dotenv

# Ejecutar el seed
npx ts-node scripts/seed-stickers.ts
```

O crear las figuritas manualmente desde el **Panel Admin** de la app.

## 8. Hacer admin a tu usuario

1. Registrarte en la app con tu email (julietagric@gmail.com)
2. En Supabase → Table Editor → profiles
3. Buscar tu usuario y cambiar `is_admin` a `true`

**Solo necesitás hacer esto UNA vez.** Después podés gestionar todo desde el Panel Admin de la app.

## 9. Deployar en Vercel

```bash
# Build para web
npm run web -- --build

# O configurar Vercel con:
# Build Command: npx expo export -p web
# Output Directory: dist
```

Variables de entorno en Vercel:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 10. Posiciones de figuritas

Las posiciones en `config/stickers.json` son **aproximadas**.
Para ajustarlas exactamente a tu imagen de fondo:

1. Abrí la app como admin
2. Ir a Panel Admin → Figuritas
3. Seleccionar cada figurita y ajustar X, Y, Ancho, Alto
4. Los valores son porcentajes (0-100) del tamaño de la imagen

## 11. Calificar el deploy de Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Loguear
supabase login

# Link al proyecto
supabase link --project-ref TU-PROJECT-REF

# Deployar funciones
supabase functions deploy open-pack
supabase functions deploy claim-daily
supabase functions deploy redeem-code
supabase functions deploy execute-trade
supabase functions deploy grant-packs
```
