#!/usr/bin/env bash
ENVIRONMENT=$1

# check nginx for deeznuts-site
FILE=/etc/nginx/sites-available/alexdeeznuts
if test -f "$FILE"; then
    echo "$FILE exists."
else
	echo "$FILE does not exist."
	if ENVIRONMENT == "development"; then
		cp ../setup/alexdeeznuts /etc/nginx/sites-available/alexdeeznuts
	else
		cp ../setup/alexdeeznuts-s /etc/nginx/sites-available/alexdeeznuts
	fi		
fi

# if nginx is not running, start nginx
if pgrep -x "nginx" > /dev/null
then

else
	echo "Starting: nginx"
    sudo nginx
fi