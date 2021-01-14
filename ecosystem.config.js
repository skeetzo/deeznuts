app = "deeznuts"
host = "127.0.0.1"
host = "192.168.1.60"
port = 3020
ssh_options = ["port=22"]
repo = "git@github.com:skeetzo/deeznuts.git"
user = "skeetzo"

module.exports = {
  // Applications part
  apps : [{
    name      : app,
    script    : 'npm',
    args      : ['start'],
    cwd       : `/var/www/apps/${app}/source`,
    interpreter : 'node@10.15.1',
    env: {
      NODE_ENV: 'development',
      PORT: port
    },
    env_staging : {
      NODE_ENV : "staging",
      PORT: port
    },
    env_production : {
      NODE_ENV: 'production',
      PORT: port
    }
  }],
  // Deployment part
  deploy : {
    "development" : {
      user : user,
      host : host,
      ssh_options: ssh_options,
      ref  : "origin/development",
      repo : repo,
      interpreter : 'node@10.15.1',
      path : `/var/www/apps/${app}`,
      "pre-deploy" : `npm install && \
                       chown -R ${user} . && \
                       pm2 startOrRestart ecosystem.config.js --env development --only ${app}`,
      env  : {
        NODE_ENV: "development",
        FORCE_COLOR: true
      }
    },
    "staging" : {
      user : user,
      host : host,
      ssh_options: ssh_options,
      ref  : "origin/staging",
      repo : repo,
      path : `/var/www/apps/${app}`,
      "post-deploy" : `npm install && \
                       chown -R ${user} . && \
                       pm2 startOrRestart ecosystem.config.js --env staging --only ${app}`,
      env  : {
        NODE_ENV: "staging",
        FORCE_COLOR: true
      }
    },
    "production" : {
      user : user,
      host : host,
      ssh_options: ssh_options,
      ref  : "origin/production",
      repo : repo,
      path : `/var/www/apps/${app}`,
      "post-deploy" : `npm install && \
                       chown -R ${user} . && \
                       pm2 startOrRestart ecosystem.config.js --env production --only ${app}`,
      env  : {
        NODE_ENV: "production",
        FORCE_COLOR: true
      }
    },
    "pi" : {
      user : "pi",
      host : host,
      "pre-setup" : "npm list pm2 -g || npm i pm2 -g",
      "ssh_options": [
        "StrictHostKeyChecking=no",
        "PasswordAuthentication=no",
        "ForwardAgent=yes"
      ],
      ref  : "origin/development",
      repo : `git@github.com:skeetzo/${app}.git`,
      path : `/var/www/apps/${app}`,
      "post-deploy" : `/var/www/apps/${app}/source/bin/menu-deploy.sh && nvm exec 10.15.0 npm install && bin/setup.sh pi && pm2 startOrRestart ecosystem.config.js --env pi --only ${app}`,
      env  : {
        NODE_ENV: "pi",
        FORCE_COLOR: true
      }
    }
  }
};