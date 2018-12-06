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
      host : "76.91.217.22",
      ref  : "origin/development",
      repo : "git@github.com:skeetzo/deeznuts.git",
      path : "/var/www/apps/deeznuts",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js --only deeznuts",
      // "pre-setup" : "apt-get install git",

      env  : {
        NODE_ENV: "development"
      }
    },
    "staging" : {
      user : "deploy",
      host : "76.91.217.22",
      ref  : "origin/staging",
      repo : "git@github.com:skeetzo/deeznuts.git",
      path : "/var/www/apps/deeznuts",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js --env staging --only deeznuts",
      "ssh_options": ["StrictHostKeyChecking=no"],
      env  : {
        NODE_ENV: "staging"
      }
    },
    "production" : {
      user : "deploy",
      host : "76.91.217.22",
      ref  : "origin/production",
      repo : "git@github.com:skeetzo/deeznuts.git",
      path : "/var/www/apps/deeznuts",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js --env production --only deeznuts",
      env  : {
        NODE_ENV: "production"
      }
    }
  }
};