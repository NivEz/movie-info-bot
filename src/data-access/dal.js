const { searchResultsKeyv, titlesKeyv } = require('./cache');
const { getImdbSearchResults, getImdbTitle } = require('../scraper');
const { buildMessageFromTitle } = require('../bot/messageBuilder');

const getSearchResults = async searchTerm => {
	const lowerSearchTerm = searchTerm.toLowerCase();
	let searchResults = await searchResultsKeyv.get(lowerSearchTerm);
	if (searchResults) {
		console.log(`Cache found for: ${searchTerm}`);
	} else {
		searchResults = await getImdbSearchResults(lowerSearchTerm);
		searchResults = searchResults.map(sr => {
			delete sr.titlePosterImageModel;
			delete sr.imageType;
			return sr;
		});
		searchResultsKeyv.set(lowerSearchTerm, searchResults);
	}
	return searchResults;
};

const getTitle = async titleId => {
	let titleTxt = await titlesKeyv.get(titleId);
	if (titleTxt) {
		console.log(`Cache found for: ${titleId}`);
	} else {
		const title = await getImdbTitle(titleId);
		titleTxt = buildMessageFromTitle(title);
		if (titleTxt) {
			titlesKeyv.set(titleId, titleTxt);
		}
	}
	return titleTxt;
};

module.exports = { getSearchResults, getTitle };
