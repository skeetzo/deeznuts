#!/usr/bin/env bash
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt-get update
sudo apt-get install ethereum
#sudo apt-get install ethereum-unstable
# abigen, bootnode, clef, evm, geth, puppeth, rlpdump, and wnode commands are then available on your system in /usr/bin/

# sudo cp bin/conf/geth.service /etc/systemd/system
# sudo chmod 0644 /etc/systemd/system/geth.service

# sudo systemctl daemon-reload

# systemctl --user enable geth.service
# systemctl --user start geth.service