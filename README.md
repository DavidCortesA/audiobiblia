# Audio Biblias

Descarga los videos del canal [AUDIO BIBLIAS](https://www.youtube.com/channel/UCJaQSWBy330FBq-bJTjzaPg) y los deja programados a las 6:00 am en tu canal de YouTube y en tus páginas de Facebook.

## Qué video toca cada día

| Serie | Regla |
|---|---|
| **Audio Biblia** | La lectura **siguiente** a la última que subiste (1 Samuel 2 → 1 Samuel 3…). El número de día del canal de origen no se usa porque ha subido el mismo plan varias veces con números distintos. El título se publica con el día del año de la fecha de publicación (configurable). |
| **Proverbios** | Proverbios *N*, donde *N* es el día del mes (3 de nov → Proverbios 3). Versión más reciente. |
| **Niños** | Audio Biblia Niños Día *N*, donde *N* es el día del año. Siempre la versión **más reciente** (las viejas tenían errores de edición). |

## Uso diario

```bash
./ab catalogo                 # trae los videos nuevos del canal de origen
./ab plan --semana            # muestra qué se publicaría (no sube nada)
./ab programar --semana       # descarga, sube y programa 7 días desde mañana
./ab programar --mes          # 30 días
./ab programar --desde 2026-11-03 --dias 3
./ab programar --semana --solo facebook
./ab estado                   # qué está programado y dónde
./ab panel                    # abre en el navegador el calendario con el estado de cada video
```

**Panel:** `./ab panel` abre una página con los últimos 7 días y los próximos 21: qué video toca cada día, si ya está en YouTube y en cada página de Facebook (con enlace), y los avisos (capítulos brincados, subidas que fallaron). Es solo para ver; la corrida diaria lo actualiza sola.

`programar` se puede volver a correr sin miedo: recuerda lo que ya subió (en `data/estado.json`) y solo completa lo que falte.

**La última Audio Biblia se detecta sola:** el canal de origen es tu propio canal, así que toma la más reciente publicada ahí (`./ab ultima-biblia` te dice cuál). Si alguna vez necesitas corregirla (por ejemplo, subiste una a mano y aún no aparece):

```bash
./ab ultima-biblia "2 Samuel 20"
```

Basta con el capítulo; si hay varias lecturas que empiezan igual (el canal ha usado más de un plan), elige la del plan actual. Si después publicas otra Biblia en el canal, esa vuelve a mandar.

### Videos mal titulados

`./ab plan` avisa con ⚠ cuando la Biblia se brinca un capítulo del Antiguo Testamento. Casi siempre es un video del canal subido con el título equivocado (o que falta). Para corregirlo sin tocar YouTube, agrega su ID y el título correcto en [data/correcciones.yaml](data/correcciones.yaml) y vuelve a correr `./ab plan`.

## Límites importantes

- **YouTube**: la API tiene una cuota diaria (consúltala en Google Cloud → APIs → YouTube Data API v3 → Cuotas). Se suben hasta `max_subidas_por_corrida` videos por corrida; si se acaba la cuota, lo que falte se sube en la siguiente. Puedes pedir más cuota gratis (formulario "YouTube API Services – Audit and Quota Extension").
- **YouTube – proyecto sin verificar**: los videos subidos por API desde un proyecto de Google Cloud no auditado **se quedan privados**. Hay que pedir la auditoría (mismo formulario de arriba). Mientras tanto pon `youtube.modo: manual` en `config.yaml`: el programa descarga todo y deja `data/youtube_manual.csv` con título, descripción, archivo y hora para subirlos desde YouTube Studio.
- **Facebook**: solo se programa hasta `max_dias_adelante` (28 días); lo demás se programa solo en las corridas siguientes.

## Configuración (una sola vez)

### 1. Programa

```bash
cp config.example.yaml config.yaml   # ya está hecho; edítalo a tu gusto
```

### 2. YouTube

1. En [Google Cloud Console](https://console.cloud.google.com/) crea un proyecto (ej. "Audio Biblias").
2. *APIs y servicios → Biblioteca* → habilita **YouTube Data API v3**.
3. *Pantalla de consentimiento OAuth* → tipo **Externo**, agrega tu correo como usuario de prueba y luego **Publicar app** (si se queda en "Prueba", el permiso caduca cada 7 días).
4. *Credenciales → Crear credenciales → ID de cliente OAuth → App de escritorio*. Descarga el JSON y guárdalo como `credenciales/youtube_client_secret.json`.
5. `./ab auth-youtube` → se abre el navegador, elige la cuenta del canal y acepta (saldrá un aviso de "app no verificada": *Configuración avanzada → Ir a Audio Biblias*).

### 3. Facebook (3 páginas)

1. En [developers.facebook.com](https://developers.facebook.com/apps) crea una app con el caso de uso **Administrar todo en tu página**.
2. En *Casos de uso → Administrar todo en tu página → Personalizar*, pulsa **Agregar** en `pages_manage_posts` y `pages_read_engagement` (`pages_show_list` ya viene). Si no están ahí, el Explorador no los ofrece.
3. Abre el [Explorador de la API Graph](https://developers.facebook.com/tools/explorer/), elige tu app, agrega esos 3 permisos, pulsa **Generate Access Token** y marca tus 3 páginas.
4. `./ab auth-facebook` → la primera vez pide el **ID de la app** y la **clave secreta** (*Configuración → Básica*); luego pega el token y elige las páginas. Se guardan tokens de página que no caducan. Si al token le falta algún permiso, te lo dice.

Mientras la app esté en modo desarrollo funciona para ti como administrador; no hace falta la revisión de Meta para publicar en tus propias páginas.

### 4. Corrida automática diaria (opcional)

```bash
./scripts/instalar_automatico.sh            # todos los días a las 7:00
./scripts/instalar_automatico.sh --quitar
```

Corre todos los días a las 7:00 y también cada vez que inicias sesión (si la Mac estaba apagada a las 7:00). Ejecuta `./ab catalogo`, `./ab programar --dias 14` y actualiza el panel. Bitácora en `data/logs/`.

Las plataformas publican a las 6:00 aunque la Mac esté apagada, porque todo queda programado con 14 días de anticipación: basta con prender la Mac de vez en cuando (al menos una vez por semana). Antes de un viaje largo, `./ab programar --mes` deja 30 días listos.

El proyecto debe estar **fuera de Documentos, Escritorio y Descargas**: macOS no deja que las tareas automáticas lean esas carpetas.

## Estructura

```
ab                     atajo para ejecutar el programa
config.yaml            horario, plantillas de títulos, opciones
audiobiblias/
  catalogo.py          lista del canal de origen y clasificación de títulos
  seleccion.py         reglas de qué video toca cada día
  descarga.py          yt-dlp (mp4 H.264, máx. 1080p)
  youtube.py           subida programada (API de YouTube)
  facebook.py          subida programada en páginas (Graph API)
  cli.py               comandos
data/                  catálogo, estado y bitácoras
credenciales/          tokens (no compartir)
videos/                descargas temporales
```

## Página web (web/)

Sitio público en Next.js 16 (Vercel): audios del día con reproductor (YouTube o Facebook · Montaña De Dios), próximos 5 días, páginas por serie y por video con SEO, app instalable (PWA) y avisos push cada mañana.

- **Datos:** la Mac envía el calendario con `./ab web-sync` (también en la corrida diaria). La página muestra cada video a partir de su hora de publicación, aunque la Mac esté apagada. Además lee el feed público del canal por si subes algo a mano.
- **Avisos:** Vercel Cron llama `/api/cron/notify` cada mañana (~6:05) y manda una notificación con los audios del día.
- **Desarrollo:** `npm --prefix web run dev` y `./ab web-sync --local`. Variables en `web/.env.example`.
