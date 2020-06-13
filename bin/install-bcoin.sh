#!/usr/bin/env bash
FILE=node_modules/bcoin
if test -d "$FILE"; then
    echo "$FILE exists."
else
	echo "$FILE does not exist."
rm -rf $FILE
chown -R $USER:$USER node_modules
git clone "git://github.com/bcoin-org/bcoin.git" node_modules/bcoin
cd node_modules/bcoin
npm rebuild
mkdir -p ~/.bcoin
cd ../..
chown -R $USER:$USER node_modules