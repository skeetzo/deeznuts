#!/usr/bin/env bash
sudo rsync --update -arvz -e "ssh" --progress /home/skeetzo/Projects/deeznuts pi@192.168.1.69:/var/www/apps
