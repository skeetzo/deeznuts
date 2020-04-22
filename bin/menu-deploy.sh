#!/usr/bin/env bash
# 3/12/2020 - Skeetzo
git clone git@github.com/matrix-io/pi-wifi node_modules

sudo chmod +x /var/www/apps/deeznuts/source/bin/menu.sh
sudo cp /var/www/apps/deeznuts/source/bin/menu.sh /usr/bin/menu