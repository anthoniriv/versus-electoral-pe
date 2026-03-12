# Versus Electoral Perú 2026

Web en Next.js + Prisma que monitorea noticias sobre candidatos presidenciales del Perú y las clasifica por gravedad.

## Stack
- Next.js 16 (App Router)
- Prisma
- TypeScript
- TailwindCSS 4

## Desarrollo local
1. Instalar dependencias:
```bash
npm install
```
2. Configurar variables:
```bash
cp .env.example .env
```
3. Ejecutar migraciones localmente:
```bash
npm run db:migrate:dev
```
4. Seed de candidatos:
```bash
npm run db:seed
```
5. Levantar la app:
```bash
npm run dev
```

## Producción con Supabase + Vercel

### 1) Crear base Postgres en Supabase
- Crea un proyecto en Supabase.
- Copia la URL de conexión Postgres (pooler recomendado para serverless).

### 2) Variables de entorno en Vercel
Configura en `Project Settings -> Environment Variables`:
- `DATABASE_URL`
- `DIRECT_URL`
- `CRON_SECRET`
- `SCRAPE_API_KEY`
- `OPENAI_API_KEY` (opcional)
- `OPENAI_MODEL` (opcional, default: `gpt-4o-mini`)
- `NEXT_PUBLIC_HOME_NEWS_COUNT` (opcional, contador estático mostrado en home)

### 3) Aplicar migraciones a Supabase
Con `DATABASE_URL` (pooler) y `DIRECT_URL` (directa) apuntando a Supabase:
```bash
npm run db:migrate:deploy
npm run db:seed
```

### 4) Deploy en Vercel
- Conecta el repositorio.
- Vercel ejecutará `npm run build`.

## Cron automático
El cron está configurado en `vercel.json`:
- `path`: `/api/cron`
- `schedule`: `0 5,17 * * *` (equivale a 00:00 y 12:00 en Perú, UTC-5)

El endpoint `/api/cron` valida `Authorization: Bearer <CRON_SECRET>` en producción.

## Scripts útiles
- `npm run scrape`: dispara scraping manual local vía `/api/scrape`
- `npm run cron`: ejecuta scraping local por script
- `npm run db:migrate:deploy`: aplica migraciones en producción
- `npm run db:seed`: inserta/actualiza candidatos base
