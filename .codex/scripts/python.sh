#!/usr/bin/env bash
set -euo pipefail

if command -v python3 >/dev/null 2>&1; then
  script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
  PYTHONPATH="${script_dir}${PYTHONPATH:+:$PYTHONPATH}" exec python3 "$@"
fi
if command -v python >/dev/null 2>&1; then
  exec python "$@"
fi
if command -v py >/dev/null 2>&1; then
  exec py -3 "$@"
fi
echo "Python 3 requis. Installer Python 3.11 ou supérieur." >&2
exit 1
