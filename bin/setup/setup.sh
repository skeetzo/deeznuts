#!/usr/bin/env bash
# 4/25/2020 - Skeetzo
# configures local Deeznuts environment on a Raspberry Pi

# update nginx conf file
# killall nginx
# sudo cp ../conf/nginx.conf /etc/nginx
# nginx

# update interfaces file
sudo cp ./conf/interfaces /etc/network/interfaces
# iptables.ipv4.nat
sudo cp ./conf/iptables.ipv4.nat /etc
sudo /sbin/iptables-restore < /etc/iptables.ipv4.nat
# rc.local
sudo cp ./conf/rc.local /etc/rc.local
# port forwarding
sudo cp ./conf/sysctl.conf /etc/sysctl.conf

# mongodb conf
# redis conf?