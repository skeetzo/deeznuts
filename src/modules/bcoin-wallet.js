var config = require('../config/index'),
    logger = config.logger;
const moment = require('moment');

const _ = require('underscore');
const {WalletClient} = require('bclient');
const {Network} = require('bcoin');

const network = Network.get(config.wallet.network);

var BTC_PRICE_CACHE = [];
var BTC_PRICE_CACHE_timeout;

const walletOptions = {
  network: network.type,
  port: network.walletPort,
  apiKey: config.bcoin.apiKey
}

const walletClient = new WalletClient(walletOptions);
const PRIMARY_WALLET = walletClient.wallet('primary');


////////////////////////////////////////////////////////////////////////

function checkCache(value) {
  for (var i=0;i<BTC_PRICE_CACHE.length;i++) {
    if (BTC_PRICE_CACHE[i][0]==value) {
      logger.debug("cached: %s", BTC_PRICE_CACHE[i]);
      return BTC_PRICE_CACHE[i][1];
    }
    else if (BTC_PRICE_CACHE[i][1]==value) {
      logger.debug("cached: %s", BTC_PRICE_CACHE[i]);
      return BTC_PRICE_CACHE[i][0];
    }
  }
  return null;
}

function addCache(values) {
  BTC_PRICE_CACHE.push(values);
  clearTimeout(BTC_PRICE_CACHE_timeout);
  BTC_PRICE_CACHE_timeout = setTimeout(function btcCacheReset() {
    BTC_PRICE_CACHE = [];
    logger.debug("btc price cache reset");
  }, config.wallet_cache_timeout);
}

module.exports.backup = function(callback) {
  // logger.crypto("Backing up WalletDB");
  logger.debug('backup path: %s', config.wallet_backup_path);
  require('fs-extra').ensureDir(config.wallet_backup_path, function (err) {
    if (err) return callback(err);
    walletClient.backup(config.wallet_backup_path).then((result) => {
      if (result.success) logger.crypto("WalletDB Backed Up");
      else return callback("Warning: Unable to backup WalletDB");
      // callback(null);
      var backupWallets = require('path').join(config.wallet_backup_path+"s", moment(new Date()).format('DD-MM-YYYY')+".tgz");
      logger.debug("backup wallets tar: %s", backupWallets);
      require('tar').c(
        {
          gzip: true,
          file: backupWallets
        },
        config.wallet_backup_path,
        backupWallets
      ).then(_ => { callback(null); })
    });
  });
}

module.exports.convertToDollar = function(value_in_satoshi, callback) {
  var cached = checkCache(value_in_satoshi);
  if (cached) return callback(null, cached);
  var value_in_btc = value_in_satoshi / 100000000;
  logger.crypto('Converting: %s satoshi -> %s BTC', value_in_satoshi, value_in_btc);
  var Exchange = require('blockchain.info/exchange');
  // Exchange.fromBTC(value_in_satoshi, "BTC")
  // .then(function (dollar) {
  //   if (!dollar) return callback('Missing BTC Converstion: '+value_in_satoshi);
  //   logger.debug('BTC to dollar: %sBTC -> $%s', value_in_satoshi, dollar);
  //   addCache(value_in_satoshi, dollar);
  //   callback(null, dollar);
  // });
  Exchange.getTicker({'currency':"USD"})
  .then(function (data) {
    if (!data.last) return callback('Missing BTC Converstion: '+value_in_satoshi);
    logger.debug('amountPerBTC: %s/BTC', data.last);
    var dollar = parseInt(data.last*value_in_btc, 10);
    logger.debug('Converted: %s/BTC * %s BTC -> +$%s', data.last, value_in_btc, dollar);
    addCache([value_in_satoshi, dollar]);
    callback(null, dollar);
  });
}

module.exports.convertToBTC = function(value_in_dollar, callback) {
  var cached = checkCache(value_in_dollar);
  if (cached) return callback(null, cached);
  logger.crypto('Converting: $%s -> BTC', value_in_dollar);
  var Exchange = require('blockchain.info/exchange');
  Exchange.toBTC(value_in_dollar, "USD")
  .then(function (btc) {
    if (!btc) return callback("Error: Missing BTC amount");
    logger.debug('Converted: $%s -> %s BTC', value_in_dollar, btc);
    addCache([value_in_dollar, btc]);
    callback(null, btc);
  });
}

module.exports.createQR = function(address, cb) {
  var QRCode = require('qrcode');
  QRCode.toDataURL(address, function (err, url) {
    if (err) return cb(err);
    // logger.debug('qrcode: %s', url);
    cb(null, url);
  });
}

// async function getAccount(accountName, walletName) {
//   // logger.crypto("Getting Wallet Account: %s - %s", accountName, walletName);
//   var wallet = await getWallet(walletName);
//   var account = await wallet.getAccount(accountName);
//   if (!account) {
//     logger.crypto("Creating Wallet Account: %s", accountName);
//     account = await wallet.createAccount(accountName, {name:accountName});
//   }
//   // else logger.crypto("Found Wallet Account: %s", accountName);
//   if (!account) logger.warn("Warning: Unable to create account");
//   // logger.debug(account);
//   return account;
// }
// module.exports.getAccount = getAccount;

// async function getAccounts(walletName) {
//   // logger.crypto("Getting Wallet Accounts: %s", walletName);
//   var wallet = await getWallet(walletName);
//   const result = await wallet.getAccounts();
//   // logger.crypto(result);
//   return result;
// }
// module.exports.getAccounts = getAccounts;

module.exports.getAddress = async function(cb) {
  // logger.crypto("Getting Address: %s - %s - %s", accountName, walletName, i);
  var wallet = await getWallet();
  const result = await wallet.createAddress("default");
  var address = result.address;
  logger.crypto("address: %s", address);
  return cb(null, address);
}

module.exports.getBalance = async function () {
  logger.crypto("Getting Balance", );
  var wallet = await getWallet();
  var balance = await wallet.getBalance();
  // logger.debug("balance: %s", JSON.stringify(balance,null,4));
  return JSON.parse(JSON.stringify(balance));
}

async function getWallet() {
  // return await walletClient.createWallet('primary');

  // var result = await walletClient.getWallets();
  // logger.log('Wallets Available: %s', result);
  // return PRIMARY_WALLET
  var wallet = walletClient.wallet("primary");
  const info = await wallet.getInfo();
  // logger.debug('wallet info: %s', JSON.stringify(info, null, 4));
  // if (!wallet||!info) {
  //   logger.warn("Wallet Not Found: %s", );
  //   logger.crypto("Creating Wallet: %s", );
  //   wallet = await walletClient.createWallet();
  //   wallet = walletClient.wallet();
  // }
  // else logger.crypto("Wallet Found: primary");
  // result = await wallet.getAccounts();
  // logger.debug('accounts: %s', result);
  return wallet;
}
module.exports.getWallet = getWallet;

async function getWalletHistory() {
  var wallet = await getWallet();
  var results = [];
  var accounts = await getAccounts();
  for (var i=0;i<accounts.length;i++) {
    // logger.crypto('account: %s', accounts[i]);
    const result = await wallet.getHistory(accounts[i].toString());
    if (!result||result==null) continue;
    for (var j=0;j<result.length;j++) {
      // logger.crypto('result: %s', JSON.stringify(result[j], null, 4));
      results.push(result[j]);
    }
  }
  return results;
}
module.exports.getWalletHistory = getWalletHistory;






// DeezNuts needs:

// Bitcoin:

// a wallet to generate addresses for videos for users
// i generate addresses for my own wallet
// i backup my own wallet
// i provide qr codes for addresses for my wallet

// Ethereum, BitcoinCash, etc