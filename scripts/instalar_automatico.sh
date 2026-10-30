#!/bin/zsh
# Instala (o quita con --quitar) la corrida diaria automática en esta Mac.
set -e
ETIQUETA=com.audiobiblias.programar
PLIST="$HOME/Library/LaunchAgents/$ETIQUETA.plist"
PROYECTO="$(cd "$(dirname "$0")/.." && pwd)"
HORA=${HORA:-7}

launchctl bootout "gui/$(id -u)/$ETIQUETA" 2>/dev/null || true
if [[ "$1" == "--quitar" ]]; then
  rm -f "$PLIST"
  echo "Corrida automática quitada."
  exit 0
fi

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$ETIQUETA</string>
  <key>ProgramArguments</key>
  <array><string>/bin/zsh</string><string>$PROYECTO/scripts/corrida_diaria.sh</string></array>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>$HORA</integer><key>Minute</key><integer>0</integer></dict>
  <!-- también al iniciar sesión, por si la Mac estaba apagada a la hora programada -->
  <key>RunAtLoad</key><true/>
</dict>
</plist>
PLIST
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Listo: se ejecutará todos los días a las $HORA:00 y cada vez que inicies sesión"
echo "(si la Mac estaba dormida a esa hora, corre al despertar)."
