#!/usr/bin/env bash
# (re)start nginx?
#
# 
./setup.sh
# start mongodb
# start redis
cd ../..
# this doesn't work but whatever?
if [ ! -d "../../node_modules" ]; then
	npm install
fi
npm start