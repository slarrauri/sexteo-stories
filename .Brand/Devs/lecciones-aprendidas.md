# Lecciones Aprendidas — SvelteKit + Appwrite

## 1. `.env` sin espacios alrededor del `=`
SvelteKit usa Vite, que parsea `.env` de forma estricta. Las variables con espacios alrededor del `=` no se cargan.

```diff
- PUBLIC_APPWRITE_ENDPOINT = "https://sfo.cloud.appwrite.io/v1"
+ PUBLIC_APPWRITE_ENDPOINT=https://sfo.cloud.appwrite.io/v1
```

> Las comillas son opcionales en Vite. Los espacios rompen el parsing.

## 2. Appwrite SDK es browser-only
El Appwrite JS SDK (`appwrite`) usa APIs del browser (`XMLHttpRequest`, `document`). En SvelteKit, el layout se renderiza en SSR (servidor) primero. Hay que proteger la inicialización:

```javascript
import { browser } from '$app/environment';

if (browser) {
    const client = new Client();
    client.setEndpoint(import.meta.env.PUBLIC_APPWRITE_ENDPOINT);
    // ...
}
```

## 3. Prefijo `PUBLIC_` obligatorio para client-side
En SvelteKit, solo las variables con prefijo `PUBLIC_` están disponibles en `import.meta.env` del browser. Las demás solo viven en el servidor.

- ✅ `PUBLIC_APPWRITE_ENDPOINT` → accesible en el browser
- ❌ `APPWRITE_API_KEY` → solo server (scripts Node)

## 4. Plan free de Appwrite Cloud — Límites
- **1 database** por proyecto
- **1 o 2 buckets** máximo
- Solución: usar un solo bucket `avatars` para todo (avatares + media)
- TODO: separar en `avatars` + `media` al migrar a self-hosted

## 5. Stores con imports dinámicos
Cuando un store importa módulos que dependen del browser, usar `await import()` en los métodos en vez de import estático en el top del archivo:

```javascript
async init() {
    if (!browser) return;
    const { account } = await import('$lib/appwrite.js');
    // ...
}
```
