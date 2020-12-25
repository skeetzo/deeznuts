#!/usr/bin/env bash
# backup ecosystem.config.js file
# replace host text in ecosystem.config.js file with
# deploy
# replace ecosystem.config.js with original
IP_LOCAL=127.0.0.1
cp ../../ecosystem.config.js ../../ecosystem.config.js-b
sed -i "s/host\s=\s\"[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*\"/host = \"$IP_LOCAL\"/g" ../../ecosystem.config.js
sed -i "s/ssh_options\s=\s[\"port=[0-9]*\"]/ssh_options = [\"port=22\"]/g" ../../ecosystem.config.js
# pm2 deploy staging setup
bin/save.sh
pm2 deploy staging update
mv ../../ecosystem.config.js-b ../../ecosystem.config.js