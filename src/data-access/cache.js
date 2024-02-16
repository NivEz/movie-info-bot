const Keyv = require('keyv');

const oneDay = 1000 * 60 * 60 * 24;

console.log('[] Launching keyv cache engine...');
const keyv = new Keyv({
	ttl: oneDay,
});

module.exports = keyv;
