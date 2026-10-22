#!/bin/bash
set -eu
cd "$(dirname "$0")"
printf '%s\n' 'ASTILLA MAPAL - Instalación en Google Apps Script'
if ! command -v node >/dev/null 2>&1 || ! node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 22 ? 0 : 1)"; then
  printf '%s\n' 'Instale Node.js LTS desde la página oficial y vuelva a abrir este archivo.'
  open 'https://nodejs.org/en/download'
  exit 1
fi
npm ci --include=dev --ignore-scripts
node scripts/install-apps-script.cjs
printf '%s\n' 'Pulse Enter para cerrar.'
read -r
