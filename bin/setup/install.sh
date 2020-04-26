#!/usr/bin/env bash
# 4/25/2020 - Skeetzo
# install local Deeznuts dependencies on a Raspberry Pi
sudo apt-get update

# install git
sudo apt-get install -y git

# install npm and node
sudo apt-get install -y build-essential libssl-dev
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh -o install_nvm.sh
# nano install_nvm.sh
bash install_nvm.sh
sudo chown -R $SUDO_USER /home/$SUDO_USER/.nvm
source ~/.profile
rm install_nvm.sh
nvm install 11.15.0 --latest-npm
# nvm install node --latest-npm

# install ffmpeg4
sudo apt-get install -y ffmpeg

# install nginx w/ rtmp

# install deeznuts for menu.js
sudo mkdir -p /var/www/apps/deeznuts/source /var/www/apps/deeznuts/shared
sudo chown -R $SUDO_USER:www-data /var/www/apps/deeznuts
git clone git@github.com:skeetzo/deeznuts --branch development --single-branch /var/www/apps/deeznuts/source
cd /var/www/apps/deeznuts/source
npm install
sudo /var/www/apps/deeznuts/source/bin/menu-deploy.sh