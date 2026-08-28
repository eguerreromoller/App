# Vitrina Automotriz — Mobile App

## Overview
Spanish-language mobile app (Expo React Native) that lets Chilean drivers discover automotive workshops (talleres). Data is served from a MongoDB backend and managed by an admin through an in-app protected panel.

## Core Features
- Directory of workshops with 9 service categories: Mecánica General, Desabolladura y Pintura, Grúas, Neumáticos, Lubricación, Frenos, Lavado, Personalización, Distribuidores.
- Search by name, service or comuna (250 ms debounced) + category filter chips.
- Categorías grid tab, Featured carousel on Home.
- Workshop detail: hero image, rating, action pills (Llamar, WhatsApp, Cómo llegar, Web), services, hours, sticky Contact CTA. Deep links to tel:, wa.me, Apple/Google Maps.
- Favorites (AsyncStorage) tab.
- Info tab: portal, WhatsApp, Facebook, Instagram + Administración entry.
- **Admin panel (JWT protected)**: login → dashboard (list/add/edit/delete workshops) → form. Token stored via expo-secure-store (`va_admin_token`).

## Tech Stack
- Backend: FastAPI + Motor (MongoDB). Auth: bcrypt + PyJWT (HS256). Endpoints under `/api`:
  - Public: `/categories`, `/comunas`, `/workshops`, `/workshops/featured`, `/workshops/{id}`
  - Auth: POST `/auth/login` (form: username, password), GET `/auth/me`
  - Protected (Bearer): POST `/workshops`, PUT `/workshops/{id}`, DELETE `/workshops/{id}`
- Frontend: Expo Router, expo-image, expo-linear-gradient, expo-haptics, react-native-keyboard-controller, Ionicons, storage util.
- Design: iOS-native clean, moss-green (#2B8A3E).

## Admin Credentials (seeded from backend .env)
- Email: `contacto@vitrinaautomotriz.cl`
- Password: `1713132`
- Idempotent admin seed on startup; unique index on email.

## Data Model
`Workshop { id (uuid str), name, category, description, address, comuna, region, phone, whatsapp, email, website, lat, lng, image_url, services[], hours{}, rating, review_count, is_featured, created_at }`. 12 seeded placeholder workshops.

## Navigation
Bottom tabs: Inicio, Categorías, Favoritos, Info. Stack: `/workshops?category=…`, `/workshop/[id]`, `/admin/login`, `/admin` (dashboard), `/admin/form` (create/edit via `?id=`).

## Implemented (dates)
- 2026-06: MVP directory (browse/search/filter/detail/favorites/info). Backend seed + endpoints.
- 2026-06: Admin panel with JWT auth + workshop CRUD. Credentials contacto@vitrinaautomotriz.cl.
- 2026-06: Portal logo added to Home + Info headers (image optimized/cropped to 800x233).
- 2026-06: "Turbo" AI assistant (OpenAI gpt-5.4 via emergentintegrations/EMERGENT_LLM_KEY). Floating button on Home → /chat. Multi-turn, asks servicio+comuna, recommends ONLY DB workshops via <<RECS:ids>> marker, returns tappable recommendation cards. History persisted in chat_messages by session_id.
- 2026-06: Global font-scaling cap (maxFontSizeMultiplier=1.2 on Text/TextInput) to prevent overflow on devices with large system fonts; enlarged category chip touch targets (40pt + hitSlop).

## Backlog / Next
- Import real workshop dataset (CSV/JSON or scrape) — bulk import.

## Legal
- Privacy Policy + Terms of Use screens (src/legal.ts content, app/legal.tsx renderer, /legal?doc=privacidad|terminos). Linked from Info tab "Legal" section. Content: Grupo Moller SpA (Leyes 19.628 / 21.719).
- Image upload from device (Emergent Object Storage) instead of pasting URL.
- Optional native map view (react-native-maps) + geolocation.
- Ratings/reviews submission.
