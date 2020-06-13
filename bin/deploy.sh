#!/usr/bin/env bash
bin/save.sh
wait
if [ -z "$1" ]; then
	set "staging"
fi
pm2 deploy $1 update