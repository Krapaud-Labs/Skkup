#!/bin/sh
set -eu

case "${E2E_SUITE:-}" in
  test/announcements-lifecycle.e2e-spec.ts)
    if [ "${ANNOUNCEMENT_E2E_ALLOW_DATABASE:-}" != "1" ] ||
      [ "${AUTH_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${EXTENSION_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${DAILY_CHECKIN_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${RAFFLE_DRAW_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${WATCH_SESSION_HEARTBEAT_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${SCRATCH_CARD_NO_WIN_E2E_ALLOW_DATABASE:-0}" != "0" ]; then
      printf '%s\n' 'Database guard mismatch for announcements lifecycle E2E.' >&2
      exit 64
    fi
    ;;
  test/auth-lifecycle.e2e-spec.ts)
    if [ "${AUTH_E2E_ALLOW_DATABASE:-}" != "1" ] ||
      [ "${ANNOUNCEMENT_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${EXTENSION_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${DAILY_CHECKIN_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${RAFFLE_DRAW_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${WATCH_SESSION_HEARTBEAT_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${SCRATCH_CARD_NO_WIN_E2E_ALLOW_DATABASE:-0}" != "0" ]; then
      printf '%s\n' 'Database guard mismatch for auth lifecycle E2E.' >&2
      exit 64
    fi
    ;;
  test/extension-pairing.e2e-spec.ts)
    if [ "${EXTENSION_E2E_ALLOW_DATABASE:-}" != "1" ] ||
      [ "${ANNOUNCEMENT_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${AUTH_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${DAILY_CHECKIN_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${RAFFLE_DRAW_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${WATCH_SESSION_HEARTBEAT_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${SCRATCH_CARD_NO_WIN_E2E_ALLOW_DATABASE:-0}" != "0" ]; then
      printf '%s\n' 'Database guard mismatch for extension pairing E2E.' >&2
      exit 64
    fi
    ;;
  test/daily-checkin.e2e-spec.ts)
    if [ "${DAILY_CHECKIN_E2E_ALLOW_DATABASE:-}" != "1" ] ||
      [ "${ANNOUNCEMENT_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${AUTH_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${EXTENSION_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${RAFFLE_DRAW_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${WATCH_SESSION_HEARTBEAT_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${SCRATCH_CARD_NO_WIN_E2E_ALLOW_DATABASE:-0}" != "0" ]; then
      printf '%s\n' 'Database guard mismatch for daily check-in E2E.' >&2
      exit 64
    fi
    ;;
  test/raffle-admin-draw.e2e-spec.ts)
    if [ "${RAFFLE_DRAW_E2E_ALLOW_DATABASE:-}" != "1" ] ||
      [ "${ANNOUNCEMENT_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${AUTH_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${EXTENSION_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${DAILY_CHECKIN_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${WATCH_SESSION_HEARTBEAT_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${SCRATCH_CARD_NO_WIN_E2E_ALLOW_DATABASE:-0}" != "0" ]; then
      printf '%s\n' 'Database guard mismatch for raffle admin draw E2E.' >&2
      exit 64
    fi
    ;;
  test/watch-session-heartbeat.e2e-spec.ts)
    if [ "${WATCH_SESSION_HEARTBEAT_E2E_ALLOW_DATABASE:-}" != "1" ] ||
      [ "${ANNOUNCEMENT_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${AUTH_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${EXTENSION_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${DAILY_CHECKIN_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${RAFFLE_DRAW_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${SCRATCH_CARD_NO_WIN_E2E_ALLOW_DATABASE:-0}" != "0" ]; then
      printf '%s\n' 'Database guard mismatch for watch session heartbeat E2E.' >&2
      exit 64
    fi
    ;;
  test/scratch-card-no-win.e2e-spec.ts)
    if [ "${SCRATCH_CARD_NO_WIN_E2E_ALLOW_DATABASE:-}" != "1" ] ||
      [ "${ANNOUNCEMENT_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${AUTH_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${EXTENSION_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${DAILY_CHECKIN_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${RAFFLE_DRAW_E2E_ALLOW_DATABASE:-0}" != "0" ] ||
      [ "${WATCH_SESSION_HEARTBEAT_E2E_ALLOW_DATABASE:-0}" != "0" ]; then
      printf '%s\n' 'Database guard mismatch for scratch card no-win E2E.' >&2
      exit 64
    fi
    ;;
  *)
    printf 'Unsupported isolated E2E suite: %s\n' "${E2E_SUITE:-<empty>}" >&2
    exit 64
    ;;
esac

npx prisma migrate deploy
exec npm run test:e2e -- --runInBand "$E2E_SUITE"
