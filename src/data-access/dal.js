const keyv = require('./cache');
const { getImdbSearchResults } = require('../scraper');

const getSearchResults = async searchTerm => {
	const lowerSearchTerm = searchTerm.toLowerCase();
	let searchResults = await keyv.get(lowerSearchTerm);
	if (searchResults) {
		console.log(`Cache found for: ${searchTerm}`);
	} else {
		searchResults = await getImdbSearchResults(lowerSearchTerm);
		searchResults = searchResults.map(sr => {
			delete sr.titlePosterImageModel;
			delete sr.imageType;
			return sr;
		});
		keyv.set(lowerSearchTerm, searchResults);
	}
	return searchResults;
};

module.exports = { getSearchResults };
