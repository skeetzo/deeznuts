module.exports = {
  // Applications part
  apps : [{
    name      : 'deeznuts',
    script    : 'npm',
    args      : 'start',
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
  // Deployment part
  deploy : {
    "development" : {
      user : "deploy",
      host : "104.34.128.2",
      ssh_options: "port=24",
      ref  : "origin/development",
      repo : "git@github.com:skeetzo/deeznuts.git",
      path : "/var/www/apps/deeznuts",
      "post-deploy" : "npm install --unsafe-perm=true --allow-root && chown -R deploy:www-data . && pm2 startOrRestart ecosystem.config.js --only deeznuts",
      env  : {
        NODE_ENV: "development",
        FORCE_COLOR: true
      }
    },
    "staging" : {
      user : "deploy",
      host : "104.34.128.2",
      ssh_options: "port=24",
      ref  : "origin/staging",
      repo : "git@github.com:skeetzo/deeznuts.git",
      path : "/var/www/apps/deeznuts",
      "post-deploy" : "npm install --unsafe-perm=true --allow-root && chown -R deploy:www-data . && pm2 startOrRestart ecosystem.config.js --env staging --only deeznuts",
      env  : {
        NODE_ENV: "staging",
        FORCE_COLOR: true
      }
    },
    "production" : {
      user : "deploy",
      host : "104.34.128.2",
      ssh_options: "port=24",
      ref  : "origin/production",
      repo : "git@github.com:skeetzo/deeznuts.git",
      path : "/var/www/apps/deeznuts",
      "post-deploy" : "npm install --unsafe-perm=true --allow-root && chown -R deploy:www-data . && pm2 startOrRestart ecosystem.config.js --env production --only deeznuts",
      env  : {
        NODE_ENV: "production",
        FORCE_COLOR: true
      }
    }
  }
};