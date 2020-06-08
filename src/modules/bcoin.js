var _ = require('underscore');
const assert = require('assert');
// const bcoin = require('bcoin');
const SPVNode = require('bcoin/lib/node/spvnode');
// const FullNode = require('bcoin/lib/node/fullnode');

var config = require('../config/index'),
    logger = config.logger;

module.exports.init = async function (callback) {
  if (!config.bcoin) return logger.warn("Error: Missing SPV Node Config");
  logger.crypto("Starting SPVNode");
  logger.crypto("- network: %s", config.bcoin.network);
  logger.crypto("- loglevel: %s", config.bcoin.logLevel);
  logger.crypto("- selfish: %s", config.bcoin.selfish);

  const node = new SPVNode(config.bcoin);
  // node = new FullNode(config.bcoin);

  // Temporary Wallet hack
  if (!node.config.bool('no-wallet') && !node.has('walletdb')) {
    const plugin = require('bcoin/lib/wallet/plugin');
    node.use(plugin);
  }

  process.on('unhandledRejection', (err, promise) => {
    logger.error(err);
  });

  process.on('SIGINT', async () => {
    await node.close();
  });

  if (!config.bcoin_syncing_chain) return logger.log("Skipping: SPV Node Sync");

  await node.ensure();
  await node.open();
  await node.connect();

  logger.crypto("Initialized SPV Node - %s", config.bcoin.network);

  function sleep(ms) {
    return new Promise(resolve=>{
      setTimeout(resolve,ms)
    })
  }
  if (config.bcoin_delay) await sleep(config.bcoin_delay);
  node.startSync();

  // node.plugins.walletdb.wdb.on('address', (details) => {
  //   logger.crypto(' -- wallet address -- \n', details)
  // });

  node.plugins.walletdb.wdb.on('tx', (tx) => {
    // logger.crypto('Received transaction:\n', tx);
    logger.crypto('Received transaction for wallet: %s', tx.id);
    // const Output = require('bcoin/lib/primitives/output');
    // const Transaction = require('../models/transaction');
    // _.forEach(tx.outputs, function (output) {
    //   output = new Output(output);
    //   logger.warn("Received tx at address: %s",output.getAddress());
    //   var tx_ = {
    //     'address': output.getAddress(),
    //     'value': output.value,
    //     'hash': tx.rhash()
    //   }
    //   Transaction.sync(tx_, function (err) {if (err) logger.warn(err)});
    // });
  });

  node.plugins.walletdb.wdb.on('confirmed', (tx) => {
    logger.crypto('Confirmed transaction:\n', tx);
    // logger.crypto('Confirmed transaction for wallet: %s', tx.id);
    var Transaction = require('../models/transaction');
    Transaction.sync(tx);
  });
  
  callback(null);
}

// module.exports.tx = async function (tx) {
  // logger.crypto('%s added to mempool.', tx.txid());

  // Create a Cpu miner job
  // const tip = node.chain.tip;
  // const job = await node.miner.createJob(tip);

  // const entry = await node.chain.getEntry(node.chain.tip.hash);
  // const block = await job.mineAsync();

  // // Add the block to the chain
  // logger.log('Adding %s to the blockchain.', block.rhash());
  // // logger.log(block);
  // await node.chain.add(block);
  // await node.relay(node.chain.db.state.tx);
  // logger.log('Added block!');
// }
