#!/usr/bin/env python3
"""irai events.jsonl から activity.json を生成する。

プライバシー厳守: title/note/evidence/reason 等の自由テキストは一切出力しない。
出すのは ts(時刻) / id / イベント種別からの定型ラベルのみ。
"""
import json
import os
import subprocess
from datetime import datetime, timezone, timedelta

JST = timezone(timedelta(hours=9))
EVENTS_PATH = os.path.expanduser("~/.irai/events.jsonl")
OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "activity.json")

LABELS = {
    "add": lambda id_: f"依頼台帳が新しい依頼 {id_} を受理",
    "claim": lambda id_: f"担当AIが {id_} に着手",
    "done": lambda id_: f"{id_} を完了（証拠つき）",
    "wait_human": lambda id_: f"{id_} が本人の判断待ちに",
    "drop": lambda id_: f"{id_} を取り下げ",
    "update": lambda id_: f"{id_} を更新",
}


def load_events(path):
    events = []
    if not os.path.exists(path):
        return events
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
            except (json.JSONDecodeError, ValueError):
                continue
            if "ts" not in d or "ev" not in d or "id" not in d:
                continue
            events.append(d)
    return events


def parse_ts(ts_str):
    try:
        return datetime.fromisoformat(ts_str)
    except ValueError:
        return None


def count_active_ai_processes():
    try:
        out = subprocess.run(
            ["pgrep", "-f", "claude"], capture_output=True, text=True, timeout=5
        ).stdout
        lines = [l for l in out.splitlines() if l.strip()]
        return len(lines)
    except Exception:
        return 0


def main():
    events = load_events(EVENTS_PATH)

    now = datetime.now(JST)
    today_str = now.strftime("%Y-%m-%d")

    today_done = 0
    today_started = 0
    today_received = 0
    total_done = 0

    for d in events:
        ts = parse_ts(d["ts"])
        if ts is None:
            continue
        ts_jst = ts.astimezone(JST)
        ev = d["ev"]
        if ev == "done":
            total_done += 1
            if ts_jst.strftime("%Y-%m-%d") == today_str:
                today_done += 1
        elif ev == "claim" and ts_jst.strftime("%Y-%m-%d") == today_str:
            today_started += 1
        elif ev == "add" and ts_jst.strftime("%Y-%m-%d") == today_str:
            today_received += 1

    # 直近20件のフィード（新しい順）
    dated_events = []
    for d in events:
        ts = parse_ts(d["ts"])
        if ts is None:
            continue
        ev = d["ev"]
        label_fn = LABELS.get(ev)
        if label_fn is None:
            continue
        dated_events.append((ts, ev, d["id"]))

    dated_events.sort(key=lambda x: x[0], reverse=True)
    feed = []
    for ts, ev, id_ in dated_events[:20]:
        feed.append(
            {
                "ts": ts.astimezone(JST).isoformat(),
                "kind": ev,
                "label": LABELS[ev](id_),
            }
        )

    result = {
        "updated_at": now.isoformat(),
        "today": {
            "done": today_done,
            "started": today_started,
            "received": today_received,
        },
        "total_done": total_done,
        "feed": feed,
        "active_now": count_active_ai_processes(),
    }

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"wrote {OUT_PATH}")
    print(json.dumps(result, ensure_ascii=False, indent=2)[:800])


if __name__ == "__main__":
    main()
