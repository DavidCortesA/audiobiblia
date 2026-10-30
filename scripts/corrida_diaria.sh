#!/bin/zsh
# Lo ejecuta launchd una vez al día: actualiza el catálogo y mantiene programados los próximos 14 días.
# launchd arranca con un PATH mínimo; yt-dlp necesita ffmpeg (Homebrew)
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
export PYTHONUNBUFFERED=1  # que la bitácora muestre el avance aunque el proceso se corte
cd "$(dirname "$0")/.."
mkdir -p data/logs
{
  echo "=== $(date) ==="
  ./ab programar --dias 14   # también actualiza el catálogo
  ./ab web-sync              # manda el calendario a la página web (si web.url está configurado)
  ./ab panel --sin-abrir
} >> "data/logs/$(date +%Y-%m).log" 2>&1
