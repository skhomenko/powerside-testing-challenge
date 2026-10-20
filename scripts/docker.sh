#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

mode=${1:-smoke}
case "$mode" in
  build|check|smoke|api|regression)
    test "$#" -eq 1 || { printf '%s\n' 'Supply only the command.' >&2; exit 2; }
    ;;
  spec)
    test "$#" -eq 2 && test -n "$2" || { printf '%s\n' 'Supply one spec path.' >&2; exit 2; }
    ;;
  *)
    printf '%s\n' 'Usage: sh scripts/docker.sh build|check|smoke|api|regression|spec <spec-path>' >&2
    exit 2
    ;;
esac

if ! command -v docker >/dev/null 2>&1; then
  printf '%s\n' 'CONFIGURATION BLOCKER: Docker is not installed or is not on PATH.' >&2
  exit 2
fi
if ! docker info --format '{{.ServerVersion}}' >/dev/null 2>&1; then
  printf '%s\n' 'CONFIGURATION BLOCKER: Docker is not running or accessible. Start Docker and check access to the selected Docker context.' >&2
  exit 2
fi

image=${POWERSIDE_TEST_IMAGE:-powerside-tests:local}
case "$mode" in
  build)
    exec docker build --tag "$image" .
    ;;
  check)
    exec docker run --rm --init --user "$(id -u):$(id -g)" "$image" run check
    ;;
  smoke|api|regression)
    set -- run "test:$mode"
    ;;
  spec)
    set -- run test:spec -- "$2"
    ;;
esac

mkdir -p results
# Mount only reports and optional private configuration, not the source tree.
# Passing environment variable names keeps their values out of process arguments.
if test -f .env.local; then
  set -- --mount "type=bind,source=$(pwd)/.env.local,target=/app/.env.local,readonly" "$image" "$@"
else
  set -- "$image" "$@"
fi
exec docker run --rm --init --shm-size=2g \
  --user "$(id -u):$(id -g)" \
  --cap-drop=ALL --security-opt=no-new-privileges \
  --env POWERSIDE_USERNAME --env POWERSIDE_PASSWORD \
  --mount "type=bind,source=$(pwd)/results,target=/app/results" \
  "$@"
