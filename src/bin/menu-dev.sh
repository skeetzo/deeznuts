#!/usr/bin/env bash
# 10/12/2019 - Skeetzo
# copies recent to bin
sudo cp /home/skeetzo/Projects/deeznuts/src/bin/menu-dev.sh /usr/bin/menu
sudo chmod +x /usr/bin/menu
sudo node /home/skeetzo/Projects/deeznuts/src/bin/menu.js "$@"