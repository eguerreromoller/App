# Vitrina Automotriz — Mobile App

## Overview
Spanish-language mobile app (Expo React Native) that lets Chilean drivers discover automotive workshops (talleres). Data is served from a seeded MongoDB backend that mirrors the categories on https://vitrinaautomotriz.cl/.

## Core Features
- Directory of workshops with 9 service categories: Mecánica General, Desabolladura y Pintura, Grúas, Neumáticos, Lubricación, Frenos, Lavado, Personalización, Distribuidores.
- Search by name, service or comuna (250 ms debounced).
- Category chip row (horizontal, sticky) on Home + full Categorías grid tab.
- Featured workshops carousel on Home.
- Workshop detail screen: hero image, rating, action pills (Llamar, WhatsApp, Cómo llegar, Web), services, opening hours, sticky Contact CTA.
- Favorites (AsyncStorage) with dedicated tab and empty state.
- Info tab: portal link, WhatsApp, Facebook, Instagram.
- Deep-link actions: `tel:`, `wa.me`, Apple Maps / Google Maps directions.

## Tech Stack
- Backend: FastAPI + Motor (MongoDB). Endpoints under `/api`: `/categories`, `/comunas`, `/workshops`, `/workshops/featured`, `/workshops/{id}`, POST `/workshops`.
- Frontend: Expo Router (file-based), expo-image, expo-linear-gradient, expo-haptics, @expo/vector-icons (Ionicons), AsyncStorage via existing `src/utils/storage`.
- Design: iOS-native clean, moss-green brand (#2B8A3E), Charcoal ink.

## Data Model
`Workshop { id, name, category, description, address, comuna, region, phone, whatsapp, email, website, lat, lng, image_url, services[], hours{}, rating, review_count, is_featured, created_at }`.
Seeded with 12 realistic Chilean placeholder workshops on first startup.

## Navigation
Bottom tabs: Inicio (`/(tabs)`), Categorías, Favoritos, Info. Stack: `/workshops?category=…` (filtered list), `/workshop/[id]` (detail).

## Not Included (yet)
- Native map view (deep links to system maps instead).
- User accounts / reviews submission.
- Real scraped data from vitrinaautomotriz.cl (placeholder seed data).

## Admin Panel (added 2026-08-17)
- JWT auth (FastAPI + bcrypt). Admin seeded idempotently from backend `.env`.
- Credentials: `admin@vitrinaautomotriz.cl` / `Vitrina2026!` (in `/app/memory/test_credentials.md`).
- Endpoints: `POST /api/auth/login` (form: username, password), `GET /api/auth/me`, protected `POST/PUT/DELETE /api/workshops`.
- Frontend: Info tab → **Administración** → `/admin/login` → `/admin` dashboard (list, edit, delete, add) → `/admin/form` (create/edit with category chips, services, hours, featured toggle). Token stored via `storage.secureSet` key `va_admin_token`. Keyboard handled with react-native-keyboard-controller.

## Next Steps
- Import real workshop dataset (CSV/JSON or scrape) via admin panel or bulk endpoint.
- Add image upload (Emergent Object Storage) instead of pasting image URLs.
- Ratings/reviews submission and optional map view.
