module.exports = {
  // Applications part
  apps : [{
    name      : 'kairos',
    script    : 'npm',
    args      : 'start',
    cwd       : '/var/www/apps/kairosnaps/source',
    instances : 1,
    env: {
      NODE_ENV: 'development',
      PORT: "3010"
    },
    env_production : {
      NODE_ENV: 'production',
      PORT: "3010"
    },
    env_staging : {
      NODE_ENV : "staging",
      PORT: "3010"
    }
  },{
    name      : 'deeznuts',
    script    : 'npm',
    args      : 'start',
    cwd       : '/var/www/apps/alexdeeznuts/source',
    // exec_mode : "cluster_mode",
    instances : 1,

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
  // Here you describe each environment
  deploy : {
    "kairos-development" : {
      user : "deploy",
      host : "76.91.217.22",
      // Branch
      ref  : "origin/development",
      // Git repository to clone
      repo : "git@github.com:skeetzo/kairos-hades.git",
      // Path of the application on target servers
      path : "/var/www/apps/kairosnaps",
      // ssh_options: ["StrictHostKeyChecking=no", "PasswordAuthentication=no"],
      // Commands / path to a script on the host machine
      // This will be executed on the host after cloning the repository
      // eg: placing configurations in the shared dir etc
      // post-setup: "ls -la",
      // Commands to execute locally (on the same machine you deploy things)
      // Can be multiple commands separated by the character ";"
      // "pre-deploy-local" : "echo 'Yo Bitch I think it\'s working",
      // Commands to be executed on the server after the repo has been cloned
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js",
      // "post-deploy" : "npm install && pm2 startOrRestart",
      // Environment variables that must be injected in all applications on this env
      env  : {
        NODE_ENV: "development"
      }
    },
    "kairos-staging" : {
      user : "deploy",
      host : "76.91.217.22",
      ref  : "origin/staging",
      repo : "git@github.com:skeetzo/kairos-hades.git",
      path : "/var/www/apps/kairosnaps",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js --env staging",
      env  : {
        NODE_ENV: "staging"
      }
    },
    "kairos-production" : {
      user : "deploy",
      host : "76.91.217.22",
      ref  : "origin/production",
      repo : "git@github.com:skeetzo/kairos-hades.git",
      path : "/var/www/apps/kairosnaps",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js --env production",
      env  : {
        NODE_ENV: "production"
      }
    },
    "deeznuts-development" : {
      user : "deploy",
      host : "76.91.217.22",
      ref  : "origin/development",
      repo : "git@github.com:skeetzo/deeznuts-hades.git",
      path : "/var/www/apps/alexdeeznuts",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js --env development",
      env  : {
        NODE_ENV: "development"
      }
    },
    "deeznuts-staging" : {
      user : "deploy",
      host : "76.91.217.22",
      ref  : "origin/staging",
      repo : "git@github.com:skeetzo/deeznuts-hades.git",
      path : "/var/www/apps/alexdeeznuts",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js --env staging",
      env  : {
        NODE_ENV: "staging"
      }
    },
    "deeznuts-production" : {
      user : "deploy",
      host : "76.91.217.22",
      ref  : "origin/production",
      repo : "git@github.com:skeetzo/deeznuts-hades.git",
      path : "/var/www/apps/alexdeeznuts",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js --env production",
      env  : {
        NODE_ENV: "production"
      }
    }
  }
};