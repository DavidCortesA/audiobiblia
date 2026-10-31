# Audio Biblia · página web y app

**https://audiobiblia.vercel.app** — la Biblia en audio cada mañana: lectura diaria, Proverbios del día y Audio Biblia Niños, de Iglesia Montaña de Dios · Castillo del Rey, A.R. (Monterrey).

Hecha con Next.js 16 (App Router, Cache Components) y publicada en Vercel. Se instala en el celular como app (PWA), manda avisos cada mañana y se actualiza sola con lo que programa la Mac (ver el [README principal](../README.md)).

<p align="center">
  <img src="docs/capturas/01-inicio-escritorio.jpg" alt="Inicio en computadora: amanecer, «La Palabra en cada amanecer» y los audios de hoy" width="900">
</p>

---

## Lo que tiene

### Hoy: escuchar con la pantalla apagada

<p>
  <img src="docs/capturas/02-inicio-celular.jpg" alt="Inicio en el celular" width="240">
  <img src="docs/capturas/03-hoy-audio.jpg" alt="Reproductor de audio del día con las tres series" width="240">
  <img src="docs/capturas/04-proximos-dias.jpg" alt="Próximos 5 días" width="240">
</p>

- **Reproductor de audio propio**: sigue sonando con la pantalla bloqueada o al cambiar de app, con controles en la pantalla de bloqueo (portada, pausa, ±15 s), velocidad 1× · 1.25× · 1.5× · 0.85× y recuerda dónde te quedaste.
- **Las tres series del día** (Biblia, Proverbios, Niños). Al terminar una, **sigue sola con la siguiente**.
- **Escuchar en Audio · YouTube · Facebook** (página Montaña De Dios). Los audios de los últimos 30 días están en Vercel Blob; los más viejos usan el video.
- **Aviso si todavía no está el audio de hoy** (antes de las 6:00, si algo se retrasó o si falta una serie).
- **Próximos 5 días** con la lectura de cada uno.

### App instalada

<p>
  <img src="docs/capturas/06-app-hoy.jpg" alt="Modo app con pestañas abajo" width="240">
  <img src="docs/capturas/07-app-reproductor.jpg" alt="Reproductor en modo app con racha y palomitas" width="240">
  <img src="docs/capturas/05-menu-celular.jpg" alt="Menú en el navegador del celular" width="240">
</p>

- Se instala desde el navegador (en iPhone: **Compartir → Agregar a pantalla de inicio**).
- Al abrirla desde el ícono detecta que está instalada y cambia a **modo app**: pestañas **Hoy · Biblia · Proverbios · Niños · Mi espacio**, portada compacta, lupa y engrane (Ajustes) arriba, sin mensajes de "instala la app".
- En el navegador tiene menú ☰ a pantalla completa y botones fijos abajo.

### Series

<p>
  <img src="docs/capturas/08-serie-biblia.jpg" alt="Serie Audio Biblia con el contador del año" width="240">
  <img src="docs/capturas/09-proverbios-31.jpg" alt="Los 31 Proverbios del mes" width="240">
</p>

- **Biblia y Niños**: cuántos audios van en el año (el contador se reinicia en enero), los 10 más recientes y "Ver todos en YouTube".
- **Proverbios**: los 31 capítulos, cada uno en su versión más reciente; el de hoy resaltado.

### Cada audio: guardar, compartir y leer

<p>
  <img src="docs/capturas/10-audio-acciones.jpg" alt="Audio con Guardar, Compartir, Imagen y Ya lo escuché" width="240">
  <img src="docs/capturas/11-lectura-rv1909.jpg" alt="Lee mientras escuchas: texto Reina-Valera 1909" width="240">
</p>

- **Guardar** en favoritos, **Compartir** (menú del celular / copiar enlace), **Imagen** (manda la imagen vertical como foto) y **Ya lo escuché**.
- **Lee mientras escuchas**: la lectura completa en texto **Reina-Valera 1909** (dominio público), por secciones, con enlace a la **RV1960** en YouVersion. Interpreta las 325 lecturas del año, incluso formatos raros ("2 Samuel 2, 3:1", "Cap. 19", "Gálatas 3 4:1-7").

### Imagen para compartir

<p>
  <img src="docs/capturas/18-compartir-biblia.jpg" alt="Imagen de la Biblia: amanecer, 2 Samuel 20" width="420">
  <img src="docs/capturas/19-compartir-proverbios.jpg" alt="Imagen de Proverbios con nubes al atardecer" width="420">
</p>
<p>
  <img src="docs/capturas/20-compartir-ninos.jpg" alt="Imagen vertical de Niños con la portada de Fuerza Kids" width="300">
</p>

- Se genera sola para cada audio (`next/og`): **horizontal** (1200×630) para la vista previa al pegar el enlace en WhatsApp/Facebook y **vertical** (1080×1350) para mandarla como foto o subirla a estados.
- Fondo por serie: amanecer (Biblia), nubes al atardecer (Proverbios) y portada de Fuerza Kids (Niños).

### Buscar, Mi espacio y Ajustes

<p>
  <img src="docs/capturas/12-buscar.jpg" alt="Buscador: David" width="240">
  <img src="docs/capturas/13-mi-espacio.jpg" alt="Mi espacio: racha, audios escuchados, avance y guardados" width="240">
  <img src="docs/capturas/14-ajustes.jpg" alt="Ajustes: apariencia" width="240">
</p>

- **Buscar** por libro, capítulo o historia ("Juan 3", "Salmo 23", "David"): sin acentos, "Salmo" = "Salmos", números exactos.
- **Mi espacio** (todo en el dispositivo, sin cuentas): racha de días 🔥, audios escuchados (se marcan solos al 90 % o con "Ya lo escuché"), avance de la Biblia del año y **guardados**. Palomitas ✓ en lo ya escuchado.
- **Ajustes**: avisos (activar/desactivar, **qué series** y **a qué hora**: 6, 7 u 8 a.m.), apariencia, instalar la app (solo si no está instalada) y contacto.

### Modo oscuro, letra grande, tablet y errores

<p>
  <img src="docs/capturas/15-modo-oscuro.jpg" alt="Modo oscuro en la página de un audio" width="240">
  <img src="docs/capturas/15b-modo-oscuro-ajustes.jpg" alt="Ajustes de apariencia en modo oscuro" width="240">
  <img src="docs/capturas/17-error-404.jpg" alt="Página 404" width="240">
</p>
<p>
  <img src="docs/capturas/16-tablet.jpg" alt="Tablet: video a todo lo ancho y las tres series en fila" width="500">
</p>

- Tema **Claro · Oscuro · Como mi celular** y letra **Normal · Grande · Muy grande**; se aplica antes de pintar (sin parpadeo).
- Diseño para celular, tablet (video a todo lo ancho y series en fila) y computadora.
- Página **404** y página de **error** con "Intentar de nuevo".

### Avisos push

- Un aviso por mañana con los audios del día de las series elegidas. Vercel Cron llama `/api/cron/notify?hora=6|7|8` (llega dentro de esa hora en el plan gratuito). Al activarlos llega un aviso de bienvenida.
- En iPhone solo funcionan con la app instalada.

### SEO

- Título y descripción propios por página (por serie y por audio), canónicas, Open Graph con imagen por audio.
- Datos estructurados: `WebSite` + `SearchAction`, `Organization`, `VideoObject`, `BreadcrumbList`, `CollectionPage`.
- `sitemap.xml` (~625 páginas, dinámico), `robots.txt`, verificado en Google Search Console.

---

## Cómo funciona por dentro

```
Mac (./ab)  ──POST /api/sync──▶  Upstash Redis  ◀── páginas (cache 1 min) ──▶ visitantes
   │  calendario (feed) + archivo del año              ▲
   │  audios AAC 48 kbps ──────────────▶ Vercel Blob   │ feed RSS del canal (respaldo)
   ▼
YouTube / Facebook (programados a las 6:00)        Vercel Cron 6/7/8 ──▶ avisos push
```

| Ruta | Qué hace |
|---|---|
| `src/lib/datos.ts` | Junta calendario + archivo + RSS; muestra cada audio desde su hora (cache 1 min, `revalidateTag("videos")`) |
| `src/lib/biblia.ts` · `data/rv1909/` | Interpreta las referencias y lee el texto RV1909 (generado con `scripts/preparar_biblia.py`) |
| `src/lib/imagen.tsx` | Imágenes para compartir con `next/og` (tipografías en `assets/fonts/`) |
| `src/lib/almacen.ts` · `push.ts` | Redis (calendario, archivo, suscriptores con sus preferencias) y envío de avisos |
| `src/app/api/sync` | Recibe el calendario de la Mac (`SYNC_TOKEN`) |
| `src/app/api/cron/notify` | Avisos de las 6, 7 y 8 (`CRON_SECRET`) |
| `src/app/api/push/*` | Suscribir, preferencias, desactivar, prueba y reporte de errores |
| `public/sw.js` | Service worker: avisos push y copia sin conexión |
| `scripts/blob.mjs` | Sube y borra audios en Vercel Blob (lo usa la Mac) |

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:3000
```

En otra terminal, desde la raíz del proyecto, `./ab web-sync --local` deja datos de prueba en `web/.local/`. Variables: copia `.env.example` a `.env.local`. Las capturas de este README están en `docs/capturas/` (tomadas del sitio publicado con Chrome sin ventana).

**Publicar:** cada push a `main` en GitHub se publica solo en Vercel (proyecto `audiobiblia`, carpeta raíz `web`).

### Variables en Vercel

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://audiobiblia.vercel.app` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` · `VAPID_PRIVATE_KEY` | Avisos push |
| `SYNC_TOKEN` | La Mac envía el calendario (igual a `credenciales/web_token.txt`) |
| `CRON_SECRET` | Protege los avisos programados y `/api/push/prueba` |
| `KV_REST_API_URL` · `KV_REST_API_TOKEN` | Upstash Redis (los pone la integración) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob de audios (lo pone la integración) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | castillodelreymdd@gmail.com |
| `NEXT_PUBLIC_FACEBOOK_PAGE_ID` | Página de Facebook para ver los videos (Montaña De Dios) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Verificación de Search Console |

Los valores reales están en `credenciales/vercel_produccion.json` en la Mac (no se sube a GitHub).
