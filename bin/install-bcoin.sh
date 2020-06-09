rm -rf node_modules/bcoin
DEPLOYER=cockthluhu
chown -R $DEPLOYER:$DEPLOYER node_modules
# curl "https://keybase.io/chjj/pgp_keys.asc" | gpg --import
# sudo chown $DEPLOYER:$DEPLOYER /home/$DEPLOYER/.gnupg/*
git clone "git://github.com/bcoin-org/bcoin.git" node_modules/bcoin
cd node_modules/bcoin
npm install --unsafe-perm=true --allow-root
npm install -g --unsafe-perm=true --allow-root
mkdir ~/.bcoin
cd ../..
chown -R $DEPLOYER:$DEPLOYER node_modules