#!/usr/bin/env bash
# sudo rm -rf node_modules # for speed convenience
rsync --update -arvz -e "ssh" --progress ../../deeznuts/* pi@192.168.1.69:/var/www/apps/deeznuts/source
