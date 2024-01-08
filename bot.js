const Telenode = require('telenode-js');
const { getImdbSearchResults, getImdbTitle } = require('./scraper');
const { joinIfExist, getNResults } = require('./utils');

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
	const chatId = messageBody.chat.id;
	if (!searchResults) {
		await bot.sendTextMessage(chatId, 'No results found');
		return;
	}
	if (searchResults.length === 1) {
		// handle single result
		const message = await buildMessageFromTitle(searchResults[0].id);
		if (!message) {
			await bot.sendTextMessage('There is no information about this title', chatId);
		}
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
		await bot.sendInlineKeyboard(chatId, 'Choose a movie or a TV show', inlineKeyboard);
	}
});

// handling search results
bot.onButton('', async callbackQuery => {
	if (callbackQuery.data.startsWith('tt')) {
		const titleId = callbackQuery.data;
		const message = await buildMessageFromTitle(titleId);
		if (!message) {
			await bot.sendTextMessage(
				'There is no information about this title',
				callbackQuery.message.chat.id,
			);
			return;
		}
		await bot.sendTextMessage(message, callbackQuery.message.chat.id);
	}
});

const buildMessageFromTitle = async titleId => {
	const titleData = (await getImdbTitle(titleId))?.aboveTheFoldData;
	if (!titleData) {
		console.warn('No title data');
		return;
	}
	const titleName = titleData.titleText.text;
	const titleType = titleData.titleType.text;
	const yearRange = titleData.releaseYear;
	let yearText = yearRange.year;
	if (titleType === 'TV Series') {
		yearText += `-${yearRange.endYear || ''}`;
	}
	const duration = titleData.runtime.displayableProperty.value.plainText;
	const genres = titleData.genres.genres.map(g => g.text);

	const plot = `\n${titleData.plot.plotText.plainText}`;
	let stars = titleData.principalCredits.filter(c => c.category.text === 'Stars');
	stars = stars[0]?.credits.map(c => c.name.nameText.text);
	stars = joinIfExist(stars, ', ') + '.\n';

	const rating = '⭐️ ' + titleData.ratingsSummary.aggregateRating;
	const voteCount = titleData.ratingsSummary.voteCount.toLocaleString();
	const ranking = titleData.meterRanking;
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

	return joinIfExist(messageLines, '\n');
};
