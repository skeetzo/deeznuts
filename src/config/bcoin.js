
module.exports = function bcoin_Config() {

	// Defaults
	this.bcoin = {
		// file:false,
		argv:true,
		env:true,
		network: 'regtest',
		db:'leveldb',
		
		// To store the chain on disk at the `prefix` location,
		// set `memory: false`.
		memory:true,
		
		persistent:false, // persistent-mempool

		loader:require,

		// Node
		prefix: "~/.bcoin",				
		maxFiles: 64,
		cacheSize: 100,

		// Workers
		workers:true,
		workersSize: 4,
		workersTimeout: 5000,

		// Logger
		logLevel:'debug',
		logConsole:true,
		logFile:true,

		// Chain
		prune: false,
		checkpoints: true,
		entryCache: 5000,
		indexTx: false,
		indexAddress: false,

		// Mempool
		mempoolSize: 100,
		limitFree: true,
		limitFreeRelay: 15,
		rejectAbsurdFees: true,
		replaceByFee: false,
		// persistentMempool: false,

		// Pool
		selfish: false,
		compact: true,
		bip37: false,
		listen: true,
		maxOutbound: 8,
		maxInbound: 30,

		// Proxy Server (browser=websockets, node=socks)
		// proxy: "foo:bar@127.0.0.1:9050",
		// onion: true,
		// upnp: true,

		// Custom list of DNS seeds
		// seeds: "seed.bitcoin.sipa.be",

		// Local Host & Port (to listen on)
		// host: "::",
		// port: 8333,

		// Public Host & Port (to advertise to peers)
		// publicHost: "127.0.0.1",
		// publicPort: 8444,

		// Always try to connect to these nodes.
		// nodes: "104.34.128.2",

		// Only try to connect to these nodes.
		// only: "127.0.0.1,127.0.0.2",
		// only: "104.34.128.2",

		// Miner

		// coinbaseFlags: // Coinbase flags (default: mined by bcoin).

		coinbaseAddress: "", // List of payout addresses, randomly selected during block creation (comma-separated).
		preverify: false,
		maxBlockWeight: 4000000, // Max block weight to mine (default: 4000000).
		reservedBlockWeight: 4000, // Amount of space reserved for coinbase (default: 4000)
		reservedBlockSigops: 400, // Amount of sigops reserved for coinbase (default: 400)

		// HTTP
		// httpHost: "::",
		// httpPort: 8332,
		ssl: false,
		sslCert: this.ssl_cert,
		sslKey: this.ssl_key,
		// apiKey: require('crypto').randomBytes(256).toString('hex').substring(0,26),
		apiKey: this.walletKey,
		noAuth: false,
		cors: false
	};

	this.bcoin.synced = false;

	// this.bcoin.nodes = "104.34.128.2";
	// this.bcoin.only = "104.34.128.2";
	// this.bcoin.publicPort = 8333;
	// this.bcoin.cacheSize = 

	this.wallet = {
		network: 'regtest',
		memory: true,
		prefix: '~/.bcoin/regtest',
		// auth: false, // Enable token auth for wallwalletKeyets (default = false). 
		// OR THE OTHER ONE
		// "wallet-auth": false, // Enable token auth for wallets (default = false).
		// walletAuth: false,
		apiKey: this.walletKey, // API key (used for accessing all wallet APIs, may be different than API key for node server).
		ssl: false,
		sslCert: this.ssl_cert,
		sslKey: this.ssl_key
	};

	this.wallet_backup_path = require('path').join(this.mnt_path, "backups/wallet");

	if (process.env.NODE_ENV=="development") {
		this.bcoin.logLevel = 'debug';
		this.bcoin.selfish = true; // Enable "selfish" mode (no relaying of txes or blocks) (default = false).	
		this.wallet.memory = false;
		this.bcoin.memory = false;
		// this.bcoin.prefix = '~/.bcoin';
		// this.wallet.prefix = '~/.bcoin';
		// this.wallet.network = "main";
		// this.bcoin.network = "main";
		// this.bcoin.logLevel = "error";
	}
	else if (process.env.NODE_ENV=="local") {
		this.bcoin.logLevel = "info";
		// this.bcoin.ssl = true;ls ~
		// this.wallet.ssl = true;
		this.wallet.memory = false;
		this.bcoin.memory = false;
		this.bcoin.persistent = true;
		this.wallet.network = 'testnet';
		this.bcoin.network = 'testnet';
		// this.bcoin.serviceKey = this.apiKey;
		// this.wallet.walletAuth = true;
		// this.wallet.noAuth = true;
		// this.bcoin.noAuth = true;
		// this.wallet.network = 'main';
		// this.bcoin.network = 'main';
		// this.bcoin.prefix = '~/.bcoin/testnet';
		this.wallet.prefix = '~/.bcoin/testnet';
	}
	else if (process.env.NODE_ENV=="staging") {
		this.bcoin.logLevel = "info";
		this.bcoin.ssl = true;
		this.wallet.ssl = true;
		this.wallet.network = 'testnet';
		this.bcoin.network = 'testnet';	
		this.wallet.memory = false;
		this.bcoin.memory = false;
		this.bcoin.persistent = true;
		// this.bcoin.prefix = '~/.bcoin/testnet';
		this.wallet.prefix = '~/.bcoin/testnet';
	}
	else if (process.env.NODE_ENV=="production") {
		this.bcoin.logLevel = 'error';
		this.bcoin.memory = false;
		this.bcoin.network = 'main';
		this.bcoin.persistent = true;
		this.bcoin.ssl = true;
		this.wallet.ssl = true;
		this.wallet.network = 'main';
		this.wallet.memory = false;
		this.wallet.auth = true;
		this.wallet.walletAuth = true;
		this.wallet.adminToken = this.walletKey;
		this.bcoin.serviceKey = this.walletKey;
		this.bcoin.prefix = '~/.bcoin';
		this.wallet.prefix = '~/.bcoin';	
	}
}

// common options
// config = Points to a custom config file, not in the prefix directory.
// network = Which network's chainparams to use for the node (main, testnet, regtest, or simnet) (default = main).
// workers = Whether to use a worker process pool for transaction verification (default = true).
// workers-size = Number of worker processes to spawn for transaction verification. By default, the worker pool will be sized based on the number of CPUs/cores in the machine.
// workers-timeout = Worker process execution timeout in milliseconds (default = 120000).
// sigcache-size = Max number of items in signature cache

// node options
// prefix = The data directory (stores databases, logs, and configs) (default=~/.bcoin).
// db = Which database backend to use (default=leveldb).
// max-files = Max open files for leveldb. Higher generally means more disk page cache benefits, but also more memory usage (default = 64).
// cache-size = Size (in MB) of leveldb cache and write buffer (default = 32mb).
// spv = Enable Simplified Payments Verification (SPV) mode

// logger options
// log-level = error, warning, info, debug, or spam (default = debug).
// log-console = true or false - whether to actually write to stdout/stderr if foregrounded (default = true).
// log-file = Whether to use a log file (default = true).

// chain options
// prune = Prune from the last 288 blocks (default = false).
// checkpoints = Use checkpoints and getheaders for the initial sync (default = true).
// index-tx = Index transactions (enables transaction endpoints in REST api) (default = false).
// index-address = Index transactions and utxos by address (default = false).

// mempool options
// mempool-size = Max mempool size in MB (default = 100).
// replace-by-fee = Allow replace-by-fee transactions (default = false).
// persistent-mempool = Save mempool to disk and read into memory on boot (default = false).

// pool options
// selfish = Enable "selfish" mode (no relaying of txes or blocks) (default = false).
// compact = Enable compact block relay (default = true).
// bip37 = Enable serving of bip37 merkleblocks (default = false).
// listen = Accept incoming connections (default = true).
// max-outbound = Max number of outbound connections (default = 8).
// max-inbound = Max number of inbound connections (default = 8).
// seeds = Custom list of DNS seeds (comma-separated).
// host = Host to listen on (default = 0.0.0.0).
// port = Port to listen on (default = 8333).
// public-host = Public host to advertise on network.
// public-port = Public port to advertise on network.
// nodes = List of target nodes to connect to (comma-separated).
// only = List of nodes to ONLY connect to (no other nodes or dns seeds will be contacted).



// http options
// http-host = HTTP host to listen on (default = 127.0.0.1).
// http-port = HTTP port to listen on (default = 8332 for mainnet).
// ssl-cert = Path to SSL cert.
// ssl-key = Path to SSL key.
// service-key = Service key (used for accessing wallet system only).
// api-key = API key (used for accessing all node APIs, may be different than API key for wallet server).
// cors = Enable "Cross-Origin Resource Sharing" HTTP headers (default = false).


// #
// # Options
// #

// # network = main

// #
// # HTTP
// #

// http-host = ::
// # http-port = 8334
// # ssl = true
// # ssl-cert = @/ssl/cert.crt
// # ssl-key = @/ssl/priv.key
// api-key = bikeshed
// # no-auth = false
// # cors = false

// #
// # Wallet
// #

// witness = false
// checkpoints = true
// wallet-auth = false

// wallet


// wallet options
// this.wallet.maxFiles = 64 // Max open files for leveldb.
// this.wallet.cacheSize = 100 // Size (in MB) of leveldb cache and write buffer.
// this.wallet.witness = false Make SegWit enabled wallets.
// this.wallet.checkpoints = true // Trust hard-coded blockchain checkpoints.

// this.wallet.auth = false // Enable token auth for wallets (default = false). 
// OR THE OTHER ONE
// this.wallet.walletAuth = false // Enable token auth for wallets (default = false).

// wallet http server options
// ssl = true // Whether to use SSL (default = false).
// ssl-key = @/ssl/cert.crt // Path to SSL key.
// ssl-cert = @/ssl/priv.key // Path to SSL cert.
// http-host = 127.0.0.1 // HTTP host to listen on (default = 127.0.0.1).
// http-port = 8334 // HTTP port to listen on (default = 8334 for mainnet).
// api-key = localConfig.walletKey // API key (used for accessing all wallet APIs, may be different than API key for node server).
// cors = false // Enable "Cross-Origin Resource Sharing" HTTP headers (default = false).
// no-auth = false // Disable auth for API server and wallets (default = false).
// admin-token = Token required if wallet-auth is enabled = restricts access to all wallet admin routes.


