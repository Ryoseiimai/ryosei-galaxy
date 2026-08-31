#!/bin/bash
# RYOSEI GALAXY を個人GitHub(ghp=Ryoseiimai)のPagesで公開する
set -e
cd ~/dev/2026-08-31-ryosei-galaxy
git branch -M main
ghp repo create ryosei-galaxy --public --source=. --push --description "RYOSEI GALAXY - AI組織を見せるページ"
ghp api -X POST repos/Ryoseiimai/ryosei-galaxy/pages -f 'build_type=legacy' -f 'source[branch]=main' -f 'source[path]=/' >/dev/null || true
echo "公開URL: https://ryoseiimai.github.io/ryosei-galaxy/ (反映まで1〜2分)"
