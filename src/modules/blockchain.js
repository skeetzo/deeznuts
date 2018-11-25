    


function convertBTCtoDollar(value_in_satoshi, callback) {
  logger.log('Converting satoshi to Dollar: %s', value_in_satoshi);
  var value_in_btc = value_in_satoshi / 100000000;
  logger.debug('satoshi to BTC: %s satoshi -> %sBTC', value_in_satoshi, value_in_btc);
  // calculate conversion rate to dollar
  var Exchange = require('blockchain.info/exchange');
  Exchange.getTicker({'currency':"USD"})
  .then(function (data) {
    if (!data.last) return callback('Missing BTC Converstion: '+value_in_satoshi);
    logger.debug('amountPerBTC: %s/BTC', data.last);
    var dollar = data.last*value_in_btc;
    logger.debug('BTC to dollar: %s/BTC * %sBTC -> +$%s', data.last, value_in_btc, dollar);
    callback(null, dollar);
  });
}
module.exports.convertBTCtoDollar = convertBTCtoDollar;



// var options = {
//   'time': (new Date()).getTime()
// };
// Exchange.toBTC(value_in_btc, 'USD', options)
// .then(function (data) {
//   logger.log('amount in USD: %s', data);
//   logger.log('data: %s', data);
//   logger.log('data: %s', JSON.stringify(data, null, 4));
// });
// Exchange.toBTC(value_in_satoshi, 'USD', options)
// .then(function (data) {
//   logger.log('amount in USD: $%s', data);
// });
// calculate conversion rate to minutes