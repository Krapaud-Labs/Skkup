#!/usr/bin/env bash
set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
backend_dir="$(cd -- "$script_dir/.." && pwd)"
compose_file="$backend_dir/docker-compose.e2e.yml"

if (( $# != 1 )); then
  printf '%s\n' \
    'Usage: backend/scripts/test-isolated-e2e-docker.sh <announcements-lifecycle|auth-lifecycle|extension-pairing|daily-checkin|raffle-admin-draw|watch-session-heartbeat|scratch-card-no-win>' >&2
  exit 64
fi

suite_key="$1"
raffle_draw_guard=0
watch_session_heartbeat_guard=0
scratch_card_no_win_guard=0
case "$suite_key" in
  announcements-lifecycle)
    suite_path='test/announcements-lifecycle.e2e-spec.ts'
    announcement_guard=1
    auth_guard=0
    extension_guard=0
    daily_checkin_guard=0
    ;;
  auth-lifecycle)
    suite_path='test/auth-lifecycle.e2e-spec.ts'
    announcement_guard=0
    auth_guard=1
    extension_guard=0
    daily_checkin_guard=0
    ;;
  extension-pairing)
    suite_path='test/extension-pairing.e2e-spec.ts'
    announcement_guard=0
    auth_guard=0
    extension_guard=1
    daily_checkin_guard=0
    ;;
  daily-checkin)
    suite_path='test/daily-checkin.e2e-spec.ts'
    announcement_guard=0
    auth_guard=0
    extension_guard=0
    daily_checkin_guard=1
    ;;
  raffle-admin-draw)
    suite_path='test/raffle-admin-draw.e2e-spec.ts'
    announcement_guard=0
    auth_guard=0
    extension_guard=0
    daily_checkin_guard=0
    raffle_draw_guard=1
    ;;
  watch-session-heartbeat)
    suite_path='test/watch-session-heartbeat.e2e-spec.ts'
    announcement_guard=0
    auth_guard=0
    extension_guard=0
    daily_checkin_guard=0
    raffle_draw_guard=0
    watch_session_heartbeat_guard=1
    ;;
  scratch-card-no-win)
    suite_path='test/scratch-card-no-win.e2e-spec.ts'
    announcement_guard=0
    auth_guard=0
    extension_guard=0
    daily_checkin_guard=0
    raffle_draw_guard=0
    watch_session_heartbeat_guard=0
    scratch_card_no_win_guard=1
    ;;
  *)
    printf 'Unsupported E2E suite: %s\n' "$suite_key" >&2
    printf '%s\n' \
      'Allowed suites: announcements-lifecycle, auth-lifecycle, extension-pairing, daily-checkin, raffle-admin-draw, watch-session-heartbeat, scratch-card-no-win' >&2
    exit 64
    ;;
esac

if [[ ! -f "$backend_dir/$suite_path" ]]; then
  printf 'E2E suite is not present yet: backend/%s\n' "$suite_path" >&2
  exit 66
fi

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  printf '%s\n' 'Docker Compose v2 is required for this isolated E2E runner.' >&2
  exit 127
fi

run_suffix="$(date -u +%Y%m%d%H%M%S)-$$-${RANDOM:-0}"
project_name="skkup-e2e-$suite_key-$run_suffix"
image_ref="skkup-e2e:$project_name"
export SKKUP_E2E_SUITE_PATH="$suite_path"
export SKKUP_E2E_IMAGE_TAG="$project_name"
export SKKUP_ANNOUNCEMENT_E2E_GUARD="$announcement_guard"
export SKKUP_AUTH_E2E_GUARD="$auth_guard"
export SKKUP_EXTENSION_E2E_GUARD="$extension_guard"
export SKKUP_DAILY_CHECKIN_E2E_GUARD="$daily_checkin_guard"
export SKKUP_RAFFLE_DRAW_E2E_GUARD="$raffle_draw_guard"
export SKKUP_WATCH_SESSION_HEARTBEAT_E2E_GUARD="$watch_session_heartbeat_guard"
export SKKUP_SCRATCH_CARD_NO_WIN_E2E_GUARD="$scratch_card_no_win_guard"

compose() {
  docker compose \
    --project-directory "$backend_dir" \
    --env-file /dev/null \
    --project-name "$project_name" \
    --file "$compose_file" \
    "$@"
}

cleanup() {
  local exit_code=$?
  local cleanup_failed=0
  trap - EXIT INT TERM
  if ! compose down --volumes --remove-orphans; then
    printf '%s\n' 'Docker Compose teardown failed; inspect only this run project:' "$project_name" >&2
    cleanup_failed=1
  fi
  if docker image inspect "$image_ref" >/dev/null 2>&1; then
    if ! docker image rm "$image_ref"; then
      printf 'Could not remove the isolated E2E image: %s\n' "$image_ref" >&2
      cleanup_failed=1
    fi
  fi
  if (( cleanup_failed && exit_code == 0 )); then
    exit_code=1
  fi
  exit "$exit_code"
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

printf 'Running %s E2E in isolated Docker project %s\n' "$suite_key" "$project_name"
compose up --build --exit-code-from e2e e2e
