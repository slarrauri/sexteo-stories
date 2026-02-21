# Tech Stack — Sexteo

## Frontend
- **Framework**: SvelteKit (compilador, 0KB runtime)
- **Styling**: CSS custom (variables.css + global.css + components.css)
- **Routing**: SvelteKit file-based routing
- **State**: Svelte stores + Appwrite persistence
- **Build**: Vite (incluido en SvelteKit)

## Backend
- **BaaS**: Appwrite (Cloud ahora → Self-hosted en prod)
- **Auth**: Appwrite Auth (guest anónimo → registro)
- **DB**: Appwrite Database (MariaDB)
- **Storage**: Appwrite Storage (avatares, media, videos)

## Infrastructure (Producción)
- **VPS**: 16GB RAM, 8 cores, 500GB storage
- **Appwrite**: Self-hosted via Docker
- **Proxy**: Nginx reverse proxy
- **Storage futuro**: Cloudflare R2 o Backblaze B2 para videos

## Decisiones técnicas
- Svelte sobre Vue/React por: 0KB runtime, transiciones built-in, bundle mínimo
- Appwrite sobre Supabase por: menor consumo RAM, file storage superior, setup simple
- Auth anónimo permite onboarding sin fricción, upgrade a cuenta real cuando quiera
