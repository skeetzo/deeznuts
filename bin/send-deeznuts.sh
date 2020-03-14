#!/usr/bin/env bash
sudo rm -rf node_modules # for speed convenience
sudo rsync --update -arvz -e "ssh" --progress /home/skeetzo/Projects/deeznuts pi@192.168.1.69:/var/www/apps
