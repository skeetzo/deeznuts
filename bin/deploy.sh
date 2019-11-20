#!/usr/bin/env bash
if [ -z "$1" ]; then
	set "production"
fi
pm2 deploy $1 update