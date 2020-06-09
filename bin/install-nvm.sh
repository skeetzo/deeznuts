#!/usr/bin/env bash
# install npm and node
sudo apt-get install -y build-essential libssl-dev
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh -o install_nvm.sh
# nano install_nvm.sh
bash install_nvm.sh
sudo chown -R $SUDO_USER /home/$SUDO_USER/.nvm
source ~/.profile
rm install_nvm.sh
nvm install --latest-npm