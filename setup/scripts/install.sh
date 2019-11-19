#!/bin/bash
# DeezNuts Installation
# 11/15/2019 - Skeetzo

echo "Installing DeezNuts"

##############################################
##############################################
##############################################

# install node and npm
echo "Installing Node & NPM..."
apt-get purge node npm
apt-get -y autoremove

rm -r /usr/bin/node
rm -r /usr/bin/npm
rm -r /opt/nodejs

wget https://nodejs.org/dist/v8.9.0/node-v8.9.0-linux-armv6l.tar.gz
sudo mv node-v8.9.0-linux-armv6l.tar.gz /opt

cd /opt
sudo tar -xzf node-v8.9.0-linux-armv6l.tar.gz
sudo mv node-v8.9.0-linux-armv6l nodejs
sudo rm node-v8.9.0-linux-armv6l.tar.gz

sudo ln -s /opt/nodejs/bin/node /usr/bin/node
sudo ln -s /opt/nodejs/bin/npm /usr/bin/npm

##############################################
##############################################
##############################################

echo "Installing Python3..."
apt install -y libssl-dev zlib1g-dev libncurses5-dev libncursesw5-dev libreadline-dev libsqlite3-dev 
apt install -y libgdbm-dev libdb5.3-dev libbz2-dev libexpat1-dev liblzma-dev tk-dev
wget https://www.python.org/ftp/python/3.6.1/Python-3.6.1.tar.xz
tar xf Python-3.6.1.tar.xz
cd Python-3.6.1
./configure --enable-optimizations
make -j 8
sudo make altinstall

##############################################
##############################################
##############################################

# install nginx and dependencies
echo "Installing Nginx..."
# prep for NGINX
apt-get update
apt-get install -y nginx
apt-get remove -y nginx
apt-get clean
rm -rf /etc/nginx/*
apt-get install -y curl build-essential libpcre3-dev libpcre++-dev zlib1g-dev libcurl4-openssl-dev libssl-dev
apt-get install -y libssl1.0-dev
apt-get install -y libssl1-dev
apt -y autoremove

###
# install nginx and rtmp
###
mkdir -p $HOME/tmp/nginx_src
cd $HOME/tmp/nginx_src
# download and install NGINX and RTMP module
git clone https://github.com/arut/nginx-rtmp-module.git

###

# git clone https://github.com/nginx/nginx.git
# or
wget http://nginx.org/download/nginx-1.9.3.tar.gz
tar -zxvf nginx-1.9.3.tar.gz
cd nginx-1.9.3
./configure --prefix=/var/www --sbin-path=/usr/sbin/nginx \
			--conf-path=/etc/nginx/nginx.conf --pid-path=/var/run/nginx.pid \
			--error-log-path=/var/log/nginx/error.log \
			--http-log-path=/var/log/nginx/access.log --with-http_ssl_module \
			--add-module=$HOME/nginx_src/nginx-rtmp-module
make
make install
cd ..

###########################
# nginx-full letsencrypt
apt-get install -y nginx-full certbot
# issue cert for domain as entered
# - maybe run in separate cert script?
# sudo certbot certonly --authenticator standalone -d example.com --pre-hook "service nginx stop" --post-hook "service nginx start"
# the nginx.conf will need to be updated with the $domain / $servers from the provided $domain
# the nginx.conf will need to be the local development and the update should copy it as a disabled site
#  in the sites-enabled
# so i need a default for sites-available
# and a default-s for after certs thats also updated with the proper $domain location for the $servers
#
# then also add cert autorenew
# 
# (crontab -l; echo "0 0 1 * * sudo certbot renew --pre-hook "service nginx stop" --post-hook "service nginx start" 2>&1") | crontab
#
# nginx
# |_ /sites-enabled
# |__ default
# |__ default-s
# |_ /sites-available
# | nginx.conf
###########################

###
# install ffmpeg and dependencies
###

# h264
git clone git://git.videolan.org/x264
cd x264
./configure --host=arm-unknown-linux-gnueabi --enable-static --disable-opencl
make
make install 
cd ..

# mp3 support
git clone https://github.com/gypified/libmp3lame.git
cd libmp3lame
./configure
make
make install 
cd ..

# ffmpeg make and install
git clone git://source.ffmpeg.org/ffmpeg.git
cd ffmpeg
./configure --arch=armel --target-os=linux --enable-gpl --enable-libx264 --enable-nonfree --enable-libmp3lame
make
make install
cd ..

# install DeezNuts
mkdir -p /var/www/apps/deeznuts
git clone https://github.com/skeetzo/deeznuts.git /var/www/apps/deeznuts
cd /var/www/apps/deeznuts
# nginx.conf and watermark.png
sudo cp setup/conf/nginx.conf /etc/nginx/nginx.conf
# sudo cp src/public/images/watermark.png /etc/nginx

# unzip and install node_modules
# tar -zxvf setup/build.tar.gz -C /var/www/apps/deeznuts
# cd /var/www/apps/deeznuts
npm install --save
chown -R $USER /var/www/apps/deeznuts

echo "DeezNuts Installed"

####################################

# auto sets up autohotspot scripts
echo 'Setting Up Auto Hotspot'

apt-get update
apt-get upgrade -y
apt-get install -y iw hostapd dnsmasq

# disable startups
systemctl disable hostapd
systemctl disable dnsmasq	

# copy hostapd.conf file
cp ../conf/hostapd.conf /etc/hostapd/hostapd.conf

# update hostapd to point to hostapd.conf
cp ../conf/hostapd /etc/default/hostapd

# update dnsmasq file
cp ../conf/dnsmasq.conf /etc/dnsmasq.conf

# update interfaces file
cp ../conf/interfaces /etc/network/interfaces

# port forwarding
cp ../conf/sysctl.conf /etc/sysctl.conf

# update wpa_supplicant
cp ../conf/wpa_supplicant.conf /etc/wpa_supplicant/wpa_supplicant.conf 

# DHCPCD
cp ../conf/dhcpcd.conf /etc/dhcpcd.conf

# service script
cp ../conf/autohotspot.service /etc/systemd/system/autohotspot.service
systemctl enable autohotspot.service

###
# rc.local
# cp conf/rc.local /etc/rc.local
###

# autohotspot script
cp ../conf/autohotspot.sh /usr/bin/autohotspot
chmod +x /usr/bin/autohotspot

# create cron
(crontab -l; echo "* * * * * sudo /usr/bin/autohotspot.sh >/dev/null 2>&1") | crontab

##############################################
##############################################
##############################################

# reboot wifi networks
# sudo reboot now