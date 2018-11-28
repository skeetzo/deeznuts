# DeezNuts
Performers' Live Streaming & Video Archive System

Available at [alexdeeznuts.com](https://alexdeeznuts.com)

## Description
DeezNuts is a Nodejs streaming solution designed for usage with a GoPro Hero 4 and a Raspberry Pi 3.

#### Howdafuck
A GoPro Hero 4 operates by generating its own WiFi for devices such as a phone to connect to. As conveniently hacked by [this repo](link) the Hero 4 requires some fancy signaling before being able to conveniently stream the feed from its camera over the WiFi. Modifying the code provided by the (repo) project allows the GoPro to stream directly to the Pi or any other connected device.

The Pi connects to the GoPro network via WiFi and a LAN via ethernet. This allows the Pi to both access the GoPro feed and be accessed by the (local or global) Internet. The NGINX config in the Pi is setup to stream a censored & watermarked stream of the live GoPro feed to any end point (Twitch, YouTube, Facebook) while forwarding the original untouched feed to the DeezNuts app.

The DeezNuts app receives the untouched, unfiltered feed. Social networks receive a feed with a watermark displaying the url to DeezNuts.com. Viewers follow the link to DeezNuts and purchase time to view the live & uncensored /& unwatermarked versions. When DeezNuts stops receiving feed, it watermarks and archives the video for purchase.

If a GoPro Hero 4 is not available, the stream can be manipulated directly with the usage of a Streaming Application such as [OBS](OBS_link). OBS can send a video stream directly to the Pi.

If a Raspberry Pi 3 is not available (they're like $20...), DeezNuts can be hosted on an AWS like cloud solution or locally on most platforms.

#### Steps
Plug in the Pi.
Turn on the GoPro.
Whamoblamo.
## How Does This Shit Work
---
DeezNuts is a Node.js built Web Application that provides a live streaming & video archive system for Performers.
### Flow
Fans: create an account for access to video  
Fans: generate a blockchain address to send BTC to add time to their account  
Fans: spend time on seconds watching live or on the duration of an archived video in seconds  

Performers: stream to rtmp://$host:8935  
Fans: enter /live and time ticks down  
Performers: end stream, video is watermarked, archived, and made available for purchase  

Fans: purchase archived video, download once  

### Layout

DeezNuts has 3 pages: Home, Live, and Videos  

The home page provides a video preview and a method to login / create an account.  
The live page provides the video element for the viewer.  
The videos page provides archived streams and purchased streams.  

The conversion table provides an easy reference for BTC to time available.  

The "Generate" button provides the means to generate a BTC address for the user to send BTC to in exchange for time in seconds.  


## Setup
---
### Install
  * Install via `git clone git@github.com:skeetzo/deeznuts`
  * Install node_modules via `npm install --save`
  * Setup config via `npm run-script setup`
  * Start via `sudo npm start`

Browse: localhost:3000

  * Configure DNS: $domain
  * Configure 'ecosystem.config.js': add $domain to hosts
  * Setup & Deploy Development Branch via pm2

Browse: http://$domain

  * Configure SSL
  * Deploy Staging Branch

Browse: https://$domain

  * Deploy Production Branch


### GoPro & Rasp Pi Setup
This project has been tested and configured to stream from a GoPro Hero 4 to a Raspberry Pi 3 (albeit without a local MongoDB, curse you dependencies). The Pi acts as both the web server and NGINX proxy for the DeezNuts app. The GoPro Hero 4 is uh co-opted for it's hackable stream ;)  

The setup requires:
  * Raspberry Pi 3
  * GoPro Hero 4







