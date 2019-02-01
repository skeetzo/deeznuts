# DeezNuts
Performers' Live Streaming & Video Archive System

Available at [alexdeeznuts.com](https://alexdeeznuts.com)

## Description
DeezNuts is a Nodejs streaming solution designed for usage with a GoPro Hero 4 and a Raspberry Pi 3. The Pi acts as a router between the GoPro's camera feed and the DeezNut's hosting server.

#### Howdafuck
A GoPro Hero 4 operates by generating its own WiFi for devices to connect to. As conveniently hacked by [KonradIT](https://github.com/KonradIT/goprowifihack) the Hero 4 only requires a simple keep-alive before being able to conveniently stream the camera feed over its WiFi network. Modifying the code provided by the [GoPro](https://github.com/KonradIT/goprowifihack) project allows a Pi to forward the stream from a GoPro to another device.

The Pi connects to the GoPro network via WiFi and a LAN via ethernet. This allows the Pi to both access the GoPro feed and be accessed by the Internet. The NGINX config in the hosting server is setup to forward a censored & watermarked stream of the live GoPro feed to any end point (Twitch, YouTube, Facebook) while forwarding the original untouched feed to the DeezNuts app.

The DeezNuts app receives the untouched, unfiltered feed and makes it available for live viewing. Social networks receive a feed with a watermark overlay displaying the url to DeezNuts.com. Viewers ideally follow the link to DeezNuts and purchase time to view the live & uncensored /& unwatermarked versions. When DeezNuts stops receiving a stream it watermarks and archives the video for purchase. A copy of the video is also uploaded / backed up to a Google Drive folder to be later automatically leaked to my OnlyFans.

If a GoPro Hero 4 is not available, the stream can be manipulated directly with the usage of a Streaming Application such as [OBS](https://obsproject.com/).

#### Steps
Turn on the GoPro's WiFi.
Plug in the Pi.
Cross fingers, run GoPro python script.
Abracadabra: dick picks

## How Does This Shit Work
---
DeezNuts is a Node.js built Web Application that provides a live streaming & video archive system for Adult Performers.

### User Flow
Fans: create an account for access to video  
Fans: generate a blockchain address to send BTC to add time to their account  
Fans: spend time on seconds watching live or on the duration of an archived video in seconds  

Performers: stream to rtmp://$host:8935  
Fans: enter /live and time ticks down  
Performers: end stream, video is watermarked, archived, backed up, and made available for purchase  

Fans: purchase archived video, download, enjoy   

### Layout

DeezNuts has 3 pages: Home, Live, and Videos  

The home page provides a video preview and a method to login / create an account.  
The live page provides the streaming element for the viewer.  
The videos page provides archived streams and purchased streams.  

The conversion table provides an easy reference for BTC to time available.  

The "Generate" button provides the means to generate a BTC address for the user to send BTC to in exchange for time in seconds.  

## Install
---
Server Environment:  
  * Node @ 9.4.0
  * Python3
  * Ubuntu ^ Xenial Xerus
  * pm2

### Steps
  * Install via `git clone git@github.com:skeetzo/deeznuts`
  * Install node_modules via `npm install --save`
  * TO DO: Setup config via `npm run-script setup`

##### Development
  * TO DO: Configure src/config/index.js via `npm run-script setup-config`
  * Start via `sudo npm start`
  * Configure 'ecosystem.config.js': add $domain and configure $host
  * Setup & Deploy Development Branch via pm2
  * Debug @ http://localhost:3000

##### Staging
  * Configure DNS: $domain
  * Configure SSL
  * Configure NGINX proxy at $host
  * Deploy Staging Branch
  * Debug @ https://$domain.com

##### Production
  * Deploy Production Branch
  * Enjoy