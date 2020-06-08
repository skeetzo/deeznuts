let HOST = "104.34.128.2"
let HOST_PI = "192.168.1.69"

module.exports = {
  apps : [{
    name      : 'deeznuts',
    // interpreter      : "node@11.15.0",
    script    : 'npm',
    args      : ['start'],
    cwd       : '/var/www/apps/deeznuts/source',
    env: {
      NODE_ENV: 'development',
      PORT: "3020"
    },
    env_production : {
      NODE_ENV: 'production',
      PORT: "3020"
    },
    env_staging : {
      NODE_ENV : "staging",
      PORT: "3020"
    }
  }],
  deploy : {
    "development" : {
      user : "deploy",
      host : HOST,
      "ssh_options": [
        "StrictHostKeyChecking=no",
        "PasswordAuthentication=no",
        "ForwardAgent=yes"
      ],
      ref  : "origin/development",
      repo : "git@github.com:skeetzo/deeznuts.git",
      path : "/var/www/apps/deeznuts",
      "post-deploy" : "npm install --unsafe-perm=true --allow-root && pm2 startOrRestart ecosystem.config.js --only deeznuts",
      env  : {
        NODE_ENV: "development",
        FORCE_COLOR: true
      }
    },
    "staging" : {
      user : "deploy",
      host : HOST,
      "ssh_options": [
        "StrictHostKeyChecking=no",
        "PasswordAuthentication=no",
        "ForwardAgent=yes"
      ],
      ref  : "origin/staging",
      repo : "git@github.com:skeetzo/deeznuts.git",
      path : "/var/www/apps/deeznuts",
      "post-deploy" : "npm install --unsafe-perm=true --allow-root && pm2 startOrRestart ecosystem.config.js --env staging --only deeznuts",
      env  : {
        NODE_ENV: "staging",
        FORCE_COLOR: true
      }
    },
    "production" : {
      user : "deploy",
      host : HOST,
      "ssh_options": [
        "StrictHostKeyChecking=no",
        "PasswordAuthentication=no",
        "ForwardAgent=yes"
      ],
      ref  : "origin/production",
      repo : "git@github.com:skeetzo/deeznuts.git",
      path : "/var/www/apps/deeznuts",
      "post-deploy" : "npm install --unsafe-perm=true --allow-root && pm2 startOrRestart ecosystem.config.js --env production --only deeznuts",
      env  : {
        NODE_ENV: "production",
        FORCE_COLOR: true
      }
    },
    "pi" : {
      user : "pi",
      host : HOST_PI,
      "pre-setup" : "npm list pm2 -g || npm i pm2 -g",
      "ssh_options": [
        "StrictHostKeyChecking=no",
        "PasswordAuthentication=no",
        "ForwardAgent=yes"
      ],
      ref  : "origin/development",
      repo : "git@github.com:skeetzo/deeznuts.git",
      path : "/var/www/apps/deeznuts",
      "post-deploy" : "/var/www/apps/deeznuts/source/bin/menu-deploy.sh && npm install && pm2 startOrRestart ecosystem.config.js --env pi --only deeznuts",
      env  : {
        NODE_ENV: "pi",
        FORCE_COLOR: true
      }
    }
  }
};