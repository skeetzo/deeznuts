#!/usr/bin/env bash
# configures local Deeznuts environment on a Raspberry Pi

# update interfaces file
sudo cp bin/conf/interfaces /etc/network/interfaces
# iptables.ipv4.nat
sudo cp bin/conf/iptables.ipv4.nat /etc
sudo /sbin/iptables-restore < /etc/iptables.ipv4.nat
# rc.local
sudo cp bin/conf/rc.local /etc/rc.local
# port forwarding
sudo cp bin/conf/sysctl.conf /etc/sysctl.conf