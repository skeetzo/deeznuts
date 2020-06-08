const bsock = require('bsock');
const {Network, ChainEntry} = require('bcoin');
const network = Network.get('regtest');
const apiKey = 'api-key';

nodeSocket = bsock.connect(network.rpcPort);
walletSocket = bsock.connect(network.walletPort);

nodeSocket.on('connect', async (e) => {
  try {
    logger.crypto('Node - Connect event:\n', e);

    // `auth` must be called before any other actions
    logger.crypto('Node - Attempting auth:\n', await nodeSocket.call('auth', apiKey));

    // `watch chain` subscribes us to chain events like `block`
    logger.crypto('Node - Attempting watch chain:\n', await nodeSocket.call('watch chain'));

    // Some calls simply request information from the server like an http request
    logger.crypto('Node - Attempting get tip:');
    const tip = await nodeSocket.call('get tip');
    logger.crypto(ChainEntry.fromRaw(tip));

  } catch (e) {
    logger.crypto('Node - Connection Error:\n', e);
  } 
});

// listen for new blocks
nodeSocket.bind('chain connect', (raw, txs) => {
  logger.crypto('Node - Chain Connect Event:\n', ChainEntry.fromRaw(raw));
});

walletSocket.on('connect', async (e) => {
  try {
    logger.crypto('Wallet - Connect event:\n', e);

    // `auth` is required before proceeding
    logger.crypto('Wallet - Attempting auth:\n', await walletSocket.call('auth', apiKey));

    // here we join all wallets, but we could also just join `primary` or any other wallet
    logger.crypto('Wallet - Attempting join *:\n', await walletSocket.call('join', '*'));

  } catch (e) {
    logger.crypto('Wallet - Connection Error:\n', e);
  } 
});

// listen for new wallet transactions
walletSocket.bind('tx', (wallet, tx) => {
  logger.crypto('Wallet - TX Event -- wallet:\n', wallet);
  logger.crypto('Wallet - TX Event -- tx:\n', tx);
});

// listen for new address events
// (only fired when current account address receives a transaction)
walletSocket.bind('address', (wallet, json) => {
  logger.crypto('Wallet - Address Event -- wallet:\n', wallet);
  logger.crypto('Wallet - Address Event -- json:\n', json);
});

walletSocket.bind('confirmed', (wallet, json) => {
  logger.crypto('Wallet - Confirmed Event -- wallet:\n', wallet);
  logger.crypto('Wallet - Confirmed Event -- json:\n', json);
});

walletSocket.bind('unconfirmed', (wallet, json) => {
  logger.crypto('Wallet - unConfirmed Event -- wallet:\n', wallet);
  logger.crypto('Wallet - unConfirmed Event -- json:\n', json);
});

walletSocket.bind('balance', (wallet, json) => {
  logger.crypto('Wallet - Balance Event -- wallet:\n', wallet);
  logger.crypto('Wallet - Balance Event -- json:\n', json);
});