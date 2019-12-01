#!/usr/bin/env bash
./bin/save.sh
wait
if [ -z "$1" ]; then
	set "production"
fi
pm2 deploy $1 update