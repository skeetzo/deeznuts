#!/usr/bin/env bash
rm -rf node_modules/bcoin
chown -R $USER:$USER node_modules
git clone "git://github.com/bcoin-org/bcoin.git" node_modules/bcoin
cd node_modules/bcoin
npm rebuild
mkdir -p ~/.bcoin
cd ../..
chown -R $USER:$USER node_modules