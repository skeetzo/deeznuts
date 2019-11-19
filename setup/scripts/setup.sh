#!/usr/bin/env bash
# 11/15/2019 - Skeetzo
# configures local Deeznuts environment
sudo killall nginx mongod redis-server
sudo mongod --fork --logpath /var/log/mongodb/mongodb.log --dbpath /var/lib/mongodb 
redis-server --daemonize yes
sudo nginx
sudo iptables -t nat -F
sudo iptables -I INPUT -p udp -m udp --dport 8554 -j ACCEPT