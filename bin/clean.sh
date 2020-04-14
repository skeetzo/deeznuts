#!/usr/bin/env bash
sudo chown -R $SUDO_USER:$SUDO_USER ../deeznuts
sudo chown -R $SUDO_USER:$SUDO_USER /home/$SUDO_USER/.pm2
# rm -rf dist/ build/ *.egg-info
# git filter-branch -f --tree-filter 'rm -rf ./OnlySnarf/config.conf' HEAD