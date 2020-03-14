#!/usr/bin/env bash
# 8/18/2019 - Skeetzo
# 10/12/2019
# copies recent to bin
# kill -9 $(lsof -t -i:8554)
sudo cp /var/www/apps/deeznuts/source/bin/menu.sh /usr/bin/menu
sudo chmod +x /usr/bin/menu
sudo node /var/www/apps/deeznuts/source/src/bin/menu.js "$@"