#!/bin/bash
# activity.json を再生成し、変更があれば commit + push する。
# launchd から呼ばれる前提。手動実行も可。
set -euo pipefail

REPO_DIR="$HOME/dev/2026-08-31-ryosei-galaxy"
LOG_FILE="$HOME/.ryosei-galaxy-live.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

cd "$REPO_DIR"

log "start update_and_push.sh"

if ! python3 update_activity.py >> "$LOG_FILE" 2>&1; then
  log "ERROR: update_activity.py failed"
  exit 1
fi

if git diff --quiet -- activity.json && git diff --cached --quiet -- activity.json; then
  log "no change, skip commit/push"
  exit 0
fi

git add activity.json
git commit -m "live update" >> "$LOG_FILE" 2>&1

if git -c credential.helper= -c "credential.helper=!ghp auth git-credential" push origin main >> "$LOG_FILE" 2>&1; then
  log "pushed"
else
  log "ERROR: push failed"
  exit 1
fi
