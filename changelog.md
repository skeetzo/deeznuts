## Changelog

**0.1.0 : 6/10/2018**
	- setup and general outline
	- app skeleton
	- rtmp
	- refacing
	- aws
	**6/20/2018**
	- blockchain.info
	**6/22/2018**
	- user login
	**6/24/2018**
	- usability fixes
	- testing
	**0.2.0 : 6/26/2018**
	- SSL
	- blockchain testing
	- model: transaction
	- debugging settings
	- writeup
	**6/25/2018**
	- social media: twitter & instagram links, snap
	- route & view: videos
	- btc for vod
	- stream testing
	**11/7/2018**
	- transmuxing debugging
	- video: archiving
	- video: previews
	**0.3.0 : 11/10/2018**
	- socket.io infrastructure
	**11/27/2018**
	- Gmail
	- debug.js
	**12/2/2018**
	- Google Drive backup to OnlyFans folder
**1.0.0 : 12/3/2018**
	- production ready
	**1.0.1 : 12/12/2018**
	- added stream's disconnect timeout
	- email: conversion metric debugging
	- mixins bug fixes
	- nginx location: /favicon/
	- User.sync update
	**12/15/2018**
	- favicons
	**12/23/2018**
	- paypal
	**1.0.2 : 1/11/2019**
	- rtmp key debugging
	**1.0.3 : 1/14/2019**
	- email debugging
	**1.0.4 : 2/1/2019**
	- GoProStream-master/stream.js
	- Tweeting rearranged to stream.js
	**1.0.5 : 2/12/2019**
	- menu.js
	**2/15/2019**
	- menu additions: connect
	- twitter: tweetOnPublish
	**2/20/2019**
	- blockchain: generateAddress rework
	**1.0.6 : 4/18/2019**
	- added PayPal to Support page
	- fixed socket.io
	**5/5/2019**
	- log update
	- PayPal form bug: _id of undefined
	**5/7/2019**
	- btc address: reload page instead of display change
	**5/8/2019**
	- gulp: fontawesome fix
	- nginx: cache permissions fix
	- cors: added
	**1.1.0 : 6/29/2019**
	- switched to wss live streaming
	**1.1.1 : 7/18/2019**
	- updated gopro menu with tweetAnds
	- setDestination & setMode for easier debugging switching
	**1.2.0 : 9/13/2019**
	- updated & cleaned menu.js
	**1.3.0 : 10/9/2019**
	- upload -> onlyfans
	**1.3.1 : 11/15/2019**
	- local scripts cleanup
	**1.3.2 : 11/19/2019**
	- save all on boot
	- upload forgotten on boot fixed
	- updated concat on publish
	- updated video.archiveVideos
	- added/moved environment settings to deploy
	**1.3.3 : 1/13/2020**
	- fixed watermarking path
	- rehoused to desktop
	**1.3.4 : 2/13/2020**
	- updated: GoProStream.py w/ local -> .flv file
	- fixed: video titles
**??/??/??**
	- next live @ & schedule
**2.0.0 : Android App : ??/??/??**
	- android rtmp relay?
# Bugs
**1.1.0**
	- chrome browser on laptop: "HtmlMediaElement.error attribute is not null" 
**1.1.1**
	- gulp file needs rewrite above version > "gulp": "^3.9.1",
	- logger needs to ensure /var/log/apps/deeznuts exists
# To Do
	- add link to live page in "i've gone live"
	- blockchain address recycling
	- view: videos -> paginate months
	- add menu option to show menu is connected