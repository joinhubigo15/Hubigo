#!/usr/bin/env bash
# Silent, unattended self-healing supervisor for run-fullpool-continuous.sh:
#  - Starts at a given concurrency (default 4).
#  - Watches its log for staleness. If nothing new lands for STALL_SECONDS (default 10 min — real
#    congestion, not just a slow query), kills the worker (and any orphaned gmaps-scraper node
#    processes — a plain `kill` does NOT reliably kill bash/node processes on Windows/Git-Bash, so
#    everything is force-stopped via PowerShell Stop-Process) and restarts it ONE CONCURRENCY LEVEL
#    DOWN. Floor is 1 (single-key) — once there, a further stall just restarts at 1 again, so
#    something is always running rather than the whole thing dying.
#  - No sound alerts. Silent by design for unattended runs.
set -uo pipefail
cd "$(dirname "$0")/../.."  # backend/

LOGFILE="${1:-/tmp/fullpool-selfheal.log}"
STALL_SECONDS="${SELFHEAL_STALL_SECONDS:-600}"  # 10 min — triggers a concurrency-drop restart
HARD_STOP_SECONDS="${SELFHEAL_HARD_STOP_SECONDS:-1500}"  # 25 min of TOTAL no-progress (across
  # restarts/concurrency drops) — gives up and stops entirely instead of restarting again, so it
  # doesn't keep burning keys against a wall that clearly isn't clearing tonight.
CHECK_INTERVAL=30
START_CONCURRENCY="${SELFHEAL_CONCURRENCY:-4}"
CONCURRENCY="$START_CONCURRENCY"
START_KEY="${FNB_START_KEY:-}"
FIRST_LAUNCH=true
# If set, restricts the pool to this comma-separated key-label list for every restart.
PERSIST_KEY_LIST="${FNB_KEY_LIST:-}"
: > "$LOGFILE"

kill_all_scraper_processes() {
  powershell -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object {\$_.CommandLine -match 'gmaps-scraper'} | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }" > /dev/null 2>&1
  powershell -Command "Get-CimInstance Win32_Process -Filter \"Name='bash.exe' or Name='sh.exe'\" | Where-Object {\$_.CommandLine -match 'run-fullpool-continuous'} | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }" > /dev/null 2>&1
}

start_worker() {
  echo "" >> "$LOGFILE"
  local start_key_arg=""
  if [ -n "$START_KEY" ] && [ "$FIRST_LAUNCH" = true ]; then
    start_key_arg="$START_KEY"
    FIRST_LAUNCH=false
  fi
  if [ -n "$PERSIST_KEY_LIST" ]; then
    echo "===== SELFHEAL: starting worker at concurrency $CONCURRENCY (persistent restricted key list) =====" >> "$LOGFILE"
    FNB_CONCURRENCY="$CONCURRENCY" FNB_KEY_LIST="$PERSIST_KEY_LIST" FNB_START_KEY="$start_key_arg" bash scripts/gmaps-scraper/run-fullpool-continuous.sh >> "$LOGFILE" 2>&1 &
  else
    echo "===== SELFHEAL: starting worker at concurrency $CONCURRENCY (full pool) =====" >> "$LOGFILE"
    FNB_CONCURRENCY="$CONCURRENCY" FNB_START_KEY="$start_key_arg" bash scripts/gmaps-scraper/run-fullpool-continuous.sh >> "$LOGFILE" 2>&1 &
  fi
  WORKER_PID=$!
}

start_worker
last_size=-1
quiet_seconds=0
total_quiet_seconds=0

while true; do
  sleep "$CHECK_INTERVAL"

  if ! kill -0 "$WORKER_PID" 2>/dev/null; then
    echo "===== SELFHEAL: worker process exited on its own — restarting at same concurrency =====" >> "$LOGFILE"
    kill_all_scraper_processes
    start_worker
    last_size=-1
    quiet_seconds=0
    continue
  fi

  # Count "Staged" lines (real progress) instead of raw file size — rejection/rotation messages
  # ("hit the concurrency cap", "rate-limited") keep writing to the log during total congestion,
  # so file size alone never goes stale even when zero actual work is happening. Tracking staged-
  # lead count is what genuinely reflects whether anything is getting done.
  size=$(grep -c "Staged" "$LOGFILE" 2>/dev/null || echo -1)
  if [ "$size" = "$last_size" ]; then
    quiet_seconds=$((quiet_seconds + CHECK_INTERVAL))
    total_quiet_seconds=$((total_quiet_seconds + CHECK_INTERVAL))
  else
    quiet_seconds=0
    total_quiet_seconds=0
  fi
  last_size=$size

  if [ "$total_quiet_seconds" -ge "$HARD_STOP_SECONDS" ]; then
    echo "===== SELFHEAL: no progress for ${total_quiet_seconds}s (>= ${HARD_STOP_SECONDS}s hard-stop threshold) — genuinely stuck, stopping entirely instead of burning more keys. =====" >> "$LOGFILE"
    kill_all_scraper_processes
    exit 0
  fi

  if [ "$quiet_seconds" -ge "$STALL_SECONDS" ]; then
    if [ "$CONCURRENCY" -gt 1 ]; then
      CONCURRENCY=$((CONCURRENCY - 1))
    fi
    echo "===== SELFHEAL: stalled ${quiet_seconds}s — killing and restarting at concurrency $CONCURRENCY =====" >> "$LOGFILE"
    kill_all_scraper_processes
    sleep 2
    start_worker
    quiet_seconds=0
    last_size=-1
  fi
done
