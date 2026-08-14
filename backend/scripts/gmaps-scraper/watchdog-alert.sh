#!/usr/bin/env bash
# Sound-alerts (via Windows beep) if the given log file hasn't grown in $STALL_SECONDS.
# Usage: watchdog-alert.sh <logfile> [stall_seconds]
set -uo pipefail

LOGFILE="$1"
STALL_SECONDS="${2:-600}"
CHECK_INTERVAL=30

last_size=-1
quiet_seconds=0
alerted=false

while true; do
  sleep "$CHECK_INTERVAL"
  if [ ! -f "$LOGFILE" ]; then
    continue
  fi
  size=$(wc -c < "$LOGFILE" 2>/dev/null || echo -1)

  if [ "$size" = "$last_size" ]; then
    quiet_seconds=$((quiet_seconds + CHECK_INTERVAL))
  else
    quiet_seconds=0
    alerted=false
  fi
  last_size=$size

  if [ "$quiet_seconds" -ge "$STALL_SECONDS" ] && [ "$alerted" = false ]; then
    echo "STALLED: $LOGFILE has not grown in ${quiet_seconds}s — alerting."
    powershell -Command "for (\$i=0; \$i -lt 5; \$i++) { [console]::beep(1200,400); Start-Sleep -Milliseconds 200 }" > /dev/null 2>&1
    alerted=true
  fi
done
