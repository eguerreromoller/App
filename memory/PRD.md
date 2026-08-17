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
- Auth / user accounts / reviews submission.
- Admin panel (POST endpoint exists; UI not built).
- Real scraped data from vitrinaautomotriz.cl (placeholder seed data).

## Next Steps
- Import real workshop dataset (CSV/JSON or scrape) via POST /api/workshops.
- Add ratings/reviews submission and optional user accounts.
- Optional native map with react-native-maps + geolocation permission.
