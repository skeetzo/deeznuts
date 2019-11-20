#!/usr/bin/env bash
sudo bin/save.sh $1
pm2 deploy production update