const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const getHtmlDocument = async url => {
	const requestOptions = {
		method: 'GET',
		redirect: 'follow',
		headers: {
			'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
			'sec-ch-ua-platform': '"Windows"',
			'user-agent':
				'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z Safari/537.36',
		},
	};
	try {
		const res = await fetch(url, requestOptions);
		const html = await res.text();
		return new JSDOM(html).window.document;
	} catch (err) {
		console.log(err);
	}
};

const getImdbSearchResults = async (searchTerm, exact) => {
	const url = new URL('https://www.imdb.com/find/');
	// tt stands for title - search for titles only (movies, serires, etc...)
	let params = { s: 'tt', q: searchTerm, exact: !!exact };
	url.search = new URLSearchParams(params).toString();
	const document = await getHtmlDocument(url.href);
	const searchResultsElement = document.querySelector('script#__NEXT_DATA__').textContent;

	const searchResults = JSON.parse(searchResultsElement)?.props?.pageProps.titleResults.results;
	return searchResults;
};

const getImdbTitle = async titleId => {
	const reqUrl = `https://www.imdb.com/title/${titleId}`;
	const document = await getHtmlDocument(reqUrl);
	const titleElement = document.querySelector('script#__NEXT_DATA__').textContent;
	const title = JSON.parse(titleElement)?.props?.pageProps;
	return title;
};

module.exports = { getImdbSearchResults, getImdbTitle };
