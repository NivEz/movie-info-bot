const Keyv = require('keyv');

const oneDay = 1000 * 60 * 60 * 24;

console.log('[] Launching keyv cache engine...');
const searchResultsKeyv = new Keyv({
	namespace: 'searchResults',
	ttl: oneDay,
});

const titlesKeyv = new Keyv({
	namespace: 'titles',
	ttl: oneDay,
});

module.exports = { searchResultsKeyv, titlesKeyv };
