#!/bin/bash
echo "\n" | sudo add-apt-repository ppa:jonathonf/ffmpeg-4
sudo apt-get update -y
sudo apt-get install ffmpeg -y
# sudo apt-get install ppa-purge && sudo ppa-purge ppa:jonathonf/ffmpeg-4