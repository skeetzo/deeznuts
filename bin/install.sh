#!/usr/bin/env bash
echo "Installing DeezNuts Environment"

# echo "* BCoin"
# bin/install-bcoin.sh > /dev/null 2>&1

# echo "* FFmpeg"
# bin/install-ffmpeg4.sh > /dev/null 2>&1

# echo "* Nginx"
# bin/install-nginx.sh > /dev/null 2>&1

# echo "* NVM"
# bin/install-nvm.sh

echo "* OnlySnarf"
sudo -H pip3 install OnlySnarf --upgrade > /dev/null 2>&1

echo "DeezNuts Installed Successfully"