const Telenode = require('telenode-js');
const { getImdbSearchResults, getImdbTitle } = require('./scraper');

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const bot = new Telenode({
	apiToken: process.env.API_TOKEN,
});

bot.createServer();

bot.onTextMessage('', async messageBody => {
	const title = messageBody.text;
	const searchResults = await getImdbSearchResults(title);
	if (!searchResults) {
		await bot.sendTextMessage(messageBody.chat.id, 'No results found');
		return;
	}
	if (searchResults.length === 1) {
		// handle single result
	} else {
		// handle multiple results (paging)
		const pagedTitles = getNResults(searchResults, 0, 5);
		const inlineKeyboard = pagedTitles.map(title => {
			const titleTextInfo = [
				title.titleNameText,
				title.titleReleaseText,
				title.titleTypeText,
				title.topCredits.join(', '),
			].filter(Boolean);
			return [
				{
					text: titleTextInfo.join(' • '),
					callback_data: title.id,
				},
			];
		});
		console.log(JSON.stringify(inlineKeyboard, null, 2));
		await bot.sendInlineKeyboard(
			messageBody.chat.id,
			'Choose a movie or a TV show',
			inlineKeyboard,
		);
	}
});

const getNResults = (results, start, n) => {
	return results.slice(start, start + n);
};

// handling search results
bot.onButton('', async messageBody => {
	console.log(messageBody);
});
