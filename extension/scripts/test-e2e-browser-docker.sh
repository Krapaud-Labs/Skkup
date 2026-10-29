#!/usr/bin/env bash
set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
extension_dir="$(cd -- "$script_dir/.." && pwd)"
compose_file="$extension_dir/docker-compose.e2e-browser.yml"

if (( $# != 0 )); then
  printf '%s\n' 'Usage: bash extension/scripts/test-e2e-browser-docker.sh' >&2
  exit 64
fi
if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  printf '%s\n' 'Docker Compose v2 is required.' >&2
  exit 127
fi

run_suffix="$(date -u +%Y%m%d%H%M%S)-$$-${RANDOM:-0}"
project_name="skkup-us003-browser-$run_suffix"
export SKKUP_US003_RUN_TAG="$project_name"
browser_image="skkup-us003-browser:$project_name"
backend_image="skkup-us003-api:$project_name"

compose() {
  docker compose --project-directory "$extension_dir" --env-file /dev/null \
    --project-name "$project_name" --file "$compose_file" "$@"
}

cleanup() {
  local exit_code=$?
  local cleanup_failed=0
  local remaining
  trap - EXIT INT TERM
  if ! compose down --volumes --remove-orphans; then
    printf 'Teardown failed for Docker project %s\n' "$project_name" >&2
    cleanup_failed=1
  fi
  for image in "$browser_image" "$backend_image"; do
    if docker image inspect "$image" >/dev/null 2>&1 && ! docker image rm "$image"; then
      printf 'Could not remove test image %s\n' "$image" >&2
      cleanup_failed=1
    fi
  done
  remaining="$(docker ps -aq --filter "label=com.docker.compose.project=$project_name")" || cleanup_failed=1
  if [[ -n "$remaining" ]]; then
    printf 'Containers remain for %s: %s\n' "$project_name" "$remaining" >&2
    cleanup_failed=1
  fi
  remaining="$(docker network ls -q --filter "label=com.docker.compose.project=$project_name")" || cleanup_failed=1
  if [[ -n "$remaining" ]]; then
    printf 'Networks remain for %s: %s\n' "$project_name" "$remaining" >&2
    cleanup_failed=1
  fi
  if (( cleanup_failed && exit_code == 0 )); then exit_code=1; fi
  exit "$exit_code"
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

printf 'Running isolated US-003 browser E2E in Docker project %s\n' "$project_name"
compose config --quiet
compose up --build --exit-code-from browser browser
