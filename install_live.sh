#!/bin/bash
# 実行はしない。本人が明示的に実行するためのコマンドを記したメモ。
# 実行するとlaunchdに30分毎の自動更新ジョブが登録される。
cp /Users/ryoseiworld/dev/2026-08-31-ryosei-galaxy/com.ryoseiworld.galaxy-live.plist ~/Library/LaunchAgents/com.ryoseiworld.galaxy-live.plist && launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.ryoseiworld.galaxy-live.plist
