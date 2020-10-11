#!/usr/bin/env bash
# configures local Deeznuts environment on a Raspberry Pi
./menu-deploy.sh

# update interfaces file
sudo cp ../bin/conf/interfaces /etc/network/interfaces

# iptables.ipv4.nat
if /sbin/ethtool eth0 | grep -q "Link detected: yes"; then
	sudo cp ../bin/conf/iptables.ipv4.nat-eth /etc/iptables.ipv4.nat
else
	sudo cp ../bin/conf/iptables.ipv4.nat-wlan /etc/iptables.ipv4.nat
fi
sudo /sbin/iptables-restore < /etc/iptables.ipv4.nat

# rc.local
sudo cp ../bin/conf/rc.local /etc/rc.local

# port forwarding
sudo cp ../bin/conf/sysctl.conf /etc/sysctl.conf