#!/usr/bin/env bash
sudo chown -R skeetzo:skeetzo ../deeznuts -R
sudo chown skeetzo:skeetzo /home/skeetzo/.pm2 -R
# rm -rf dist/ build/ *.egg-info
# git filter-branch -f --tree-filter 'rm -rf ./OnlySnarf/config.conf' HEAD