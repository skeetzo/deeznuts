#!/usr/bin/env bash
# backup ecosystem.config.js file
# replace host text in ecosystem.config.js file with
# deploy
# replace ecosystem.config.js with original
APP=deeznuts
HOST_REMOTE=47.156.158.180
PORT_REMOTE=26
cp ../$APP/ecosystem.config.js ../$APP/ecosystem.config.js-b
sed -i "s/host\s=\s\"[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*\"/host = \"$HOST_REMOTE\"/g" ../$APP/ecosystem.config.js
sed -i "s/ssh_options\s=\s[\"port=[0-9]*\"]/ssh_options = [\"port=$PORT_REMOTE\"]/g" ../$APP/ecosystem.config.js
# pm2 deploy staging setup
bin/save.sh
pm2 deploy $1 setup
mv ../$APP/ecosystem.config.js-b ../$APP/ecosystem.config.js
bin/save.sh