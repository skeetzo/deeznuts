const EthereumWallet = require('node-ethereum-wallet')


// ethereum is started on deployment
// i need to make sure a default wallet exists

// i need a function to return addresses

// i need to be able to monitor addresses














// let myWallet = new EthereumWallet() // using MyEtherAPI.com web3 HTTP provider
// let myWallet = new EthereumWallet('https://mainnet.infura.io/<your infura key>') // using Infura provider

let myWallet = new EthereumWallet('https://localhost:8456') // using your local provider

await myWallet.init()

// It may receive an optional argument which is a folder where to keep the wallet data. 
// By default, it is "~/.ethereum-cli". You can change it so:

await myWallet.init("~/.ethereum")




// Creating wallet

// If your wallet hasn't been created yet, it's needed to create it.

// It's easy to check if your wallet has been created. Just check for the existence of a keystore.

if (await myWallet.hasKeystore) {
	// wallet exists
} else {
	// wallet does not exist
}

// In order to create a wallet, you need a seed. Generate one so:

let seed = myWallet.generateSeed()

// Save the seed safely, then create the keystore:

let password = 'your-wallet-password' // choose one
await myWallet.createKeystore(password, seed)




// Unlocking your wallet

// If you are going to perform any action that requires password (i.e. sending funds, signing transactions, generating wallets), unlock your wallet so:

await myWallet.unlock('your-wallet-password')

// In order to check if your wallet is unlocked, just check if myWallet.isUnlocked is true.





// Generating addresses

// It is needed to generate an address. To do so, just call:

let address = await myWallet.getNewAddress()

// It will return the new address as a string.

// In order to generate multiple addresses, specify the amount of addresses to generate:

let addresses = await myWallet.getNewAddress(5)

// It will return an array with the addresses.

// If needed, you can get an address' private key with:

let privKey = myWallet.dumpPrivKey('address')

// Or even convert a private key back to address:

let walletAddress = myWallet.privKeyToAddress(privKey)

// An array of ever generated addresses is always available at:

let myAddresses = myWallet.addresses

// Getting your balance

// Your balance summed up (from all your wallets) can be obtained, in weis, through:

let balance = await myWallet.balance

// Whereas the balance of an specified address is found with:

let balance = await myWallet.getBalance('address')

// It can receive an optional argument, with the number of confirmations needed for a balance to be summed up (default is 1).

let balanceWith3Confs = await myWallet.getBalance('address', 3)

// Blocks and Transactions

// You can get the current block number with:

let blockCount = await myWallet.blockNumber

// Information about a block is got with:

let blockInfo = await myWallet.getBlock(block_id_or_hash)

// Information about a specified transaction is available by:

let txInfo = await myWallet.getTransaction('txid')







