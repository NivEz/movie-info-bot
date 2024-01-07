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
bot.onButton('', async callbackQuery => {
	if (callbackQuery.data.startsWith('tt')) {
		const titleId = callbackQuery.data;
		const title = await getImdbTitle(titleId);
		const titleName = title.aboveTheFoldData.titleText.text;
		const titleType = title.aboveTheFoldData.titleType.text;
		const yearRange = title.aboveTheFoldData.releaseYear;
		let yearText = yearRange.year;
		if (titleType === 'TV Series') {
			yearText += `-${yearRange.endYear || ''}`;
		}
		const duration = title.aboveTheFoldData.runtime.displayableProperty.value.plainText;
		const genres = title.aboveTheFoldData.genres.genres.map(g => g.text);

		const plot = `\n${title.aboveTheFoldData.plot.plotText.plainText}`;
		let stars = title.aboveTheFoldData.principalCredits.filter(
			c => c.category.text === 'Stars',
		);
		stars = stars[0]?.credits.map(c => c.name.nameText.text);
		stars = joinIfExist(stars, ', ') + '.\n';

		const rating = '⭐️ ' + title.aboveTheFoldData.ratingsSummary.aggregateRating;
		const voteCount = title.aboveTheFoldData.ratingsSummary.voteCount.toLocaleString();
		const ranking = title.aboveTheFoldData.meterRanking;
		const currentRank = ranking.currentRank;
		const rankDif = ranking.rankChange.difference;
		let rankingText = ranking.currentRank;
		switch (ranking.rankChange.changeDirection) {
			case 'UP':
				rankingText = `🟢 ${currentRank} ↗️ ${rankDif}`;
				break;
			case 'DOWN':
				rankingText = `🔴 ${currentRank} ↘️ ${rankDif}`;
				break;
			case 'FLAT':
				rankingText = `⚪️ ${currentRank}`;
				break;
		}
		const imdbUrl = `https://www.imdb.com/title/${titleId}`;
		const messageLines = [
			titleName,
			joinIfExist([titleType, yearText, duration], ' • '),
			genres.join(', '),
			plot,
			stars,
			joinIfExist([rating, voteCount, rankingText], ' • '),
			imdbUrl,
		];

		await bot.sendTextMessage(joinIfExist(messageLines, '\n'), callbackQuery.message.chat.id);
	}
});

const joinIfExist = (arr, separator) => arr?.filter(Boolean).join(separator);
