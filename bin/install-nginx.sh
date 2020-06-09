#!/bin/bash
# 4/21/2019 - Skeetzo
# 8/17/2019

# requires ffmpeg

# install nginx and dependencies

# prep by removing and reinstalling defaults
# apt autoremove -y nginx nginx-common nginx-core
# sudo apt-get autoremove -y
sudo apt-get remove -y nginx nginx-common nginx-core --purge
sudo apt-get update -y
sudo apt-get install -y nginx nginx-full
sudo apt-get remove -y nginx
sudo apt-get clean -y
sudo rm -rf /etc/nginx
sudo mkdir -p /etc/nginx
sudo apt-get install -y gcc curl build-essential
wait
sudo apt-get install -y libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev
wait
# sudo apt-get install -y libpcre3-dev libpcre++-dev zlib1g-dev libxml2 libxml2-dev 
# wait
# sudo apt-get install -y libssl1.0-dev libcurl4-openssl-dev libssl-dev
# wait
sudo apt-get install -y libssl-dev
wait
# prep directory
sudo mkdir -p /var/www
sudo mkdir -p /etc/nginx
sudo mkdir -p /var/log/nginx
mkdir -p /tmp/nginx_src
sudo chown -R $SUDO_USER /home/$SUDO_USER

cd /tmp/nginx_src

# geoip
sudo apt-get install -y libgeoip-dev
# sudo apt-get install -y nginx-module-geoip

# download and install NGINX and RTMP module
git clone https://github.com/arut/nginx-rtmp-module.git
# or
# git clone https://github.com/nginx/nginx.git

wget http://nginx.org/download/nginx-1.16.0.tar.gz
tar -zxvf nginx-1.16.0.tar.gz
cd nginx-1.16.0

./configure \
--error-log-path=/var/log/nginx/error.log \
--http-log-path=/var/log/nginx/access.log \
--with-http_ssl_module \
--prefix=/etc/nginx \
--pid-path=/var/log/nginx/nginx.pid \
--sbin-path=/usr/sbin/nginx \
--conf-path=/etc/nginx/nginx.conf \
--modules-path=/etc/nginx/modules \
--user=www-data \
--group=www-data \
--with-http_geoip_module \
--with-http_auth_request_module \
--with-stream \
--with-http_v2_module \
--with-http_ssl_module \
--with-http_realip_module \
--with-http_addition_module \
--with-http_sub_module \
--with-http_dav_module \
--with-http_flv_module \
--with-http_mp4_module \
--with-http_gunzip_module \
--with-http_gzip_static_module \
--with-http_random_index_module \
--with-http_secure_link_module \
--with-http_stub_status_module \
--with-pcre \
--with-debug \
--without-http_scgi_module \
--without-http_uwsgi_module \
--add-module=../nginx-rtmp-module \
--with-mail \
--with-mail_ssl_module \
# --with-openssl=/tmp/nginx_src/openssl-1.1.1
# --with-openssl=/usr/local/openssl-1.0.2h/ 
# --with-openssl=/usr/bin/openssl
# --pid-path=/var/run/nginx.pid \
# --pid-path=/etc/nginx/nginx.pid \
# --lock-path=/var/run/nginx.lock \

make
sudo make install

cd ~
sudo rm -r /tmp/nginx_src
sudo mkdir -p /tmp/nginx/cache
sudo mkdir -p /tmp/nginx/streamcache
# sudo mkdir -p /var/log/nginx
# echo "Fixing Permissions"
sudo chown -R $SUDO_USER:www-data /var/log/nginx
sudo chown -R $SUDO_USER:www-data /etc/nginx
sudo chown -R $SUDO_USER:www-data /tmp/nginx

# echo "Copying"
sudo cp bin/conf/nginx.conf /etc/nginx
# copy .service file
sudo cp bin/conf/nginx.service /etc/systemd/system
# sudo cp -r /home/deploy/code/nginx/hades-backup/* /etc/nginx
sudo chmod 0644 /etc/systemd/system/nginx.service

sudo systemctl daemon-reload

sudo systemctl start nginx.service
sudo systemctl status nginx.service