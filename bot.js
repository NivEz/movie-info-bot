const Telenode = require('telenode-js');
const { getImdbSearchResults, getImdbTitle } = require('./scraper');
const { joinIfExist, getNResults } = require('./utils');

const pageSize = 5;

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const bot = new Telenode({
	apiToken: process.env.API_TOKEN,
});

bot.createServer();

bot.onTextMessage('', async messageBody => {
	const searchTerm = messageBody.text;
	const searchResults = await getImdbSearchResults(searchTerm);
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
		// handle multiple results (pagination)
		const paginatedTitles = getNResults(searchResults, 0, pageSize);
		const inlineKeyboard = paginatedTitles.map(title => {
			const titleTextInfo = [
				title.titleNameText,
				title.titleReleaseText,
				title.titleTypeText,
				title.topCredits.join(', '),
			];
			return [
				{
					text: joinIfExist(titleTextInfo, ' • '),
					callback_data: title.id,
				},
			];
		});
		// if there are more than 5 results, add a button to go to the next page
		if (searchResults.length > 5) {
			inlineKeyboard.push([
				{
					text: 'Next page',
					callback_data: `searchTerm=${searchTerm}__startIdx=5`,
				},
			]);
		}
		await bot.sendInlineKeyboard(chatId, 'Choose a movie or a TV show', inlineKeyboard);
	}
});

// handling search results
bot.onButton('', async callbackQuery => {
	const data = callbackQuery.data;
	if (data.startsWith('tt')) {
		// In that case data is the title ID
		const message = await buildMessageFromTitle(data);
		if (!message) {
			await bot.sendTextMessage(
				'There is no information about this title',
				callbackQuery.message.chat.id,
			);
			return;
		}
		await bot.sendTextMessage(message, callbackQuery.message.chat.id);
		return;
	}
	if (data.startsWith('searchTerm=')) {
		// In that case data is the search term and the start index (pagination)
		const splittedData = data.split('__');
		const searchTerm = splittedData[0].split('=')[1];
		let startIdx = Number(splittedData[1].split('=')[1]);
		const searchResults = await getImdbSearchResults(searchTerm);
		const isFirstPage = startIdx <= 0; // should be === but <= just for edge cases
		const isLastPage = searchResults.length - pageSize <= startIdx;
		if (isFirstPage) {
			startIdx = 0;
		}
		const paginatedTitles = getNResults(searchResults, startIdx, pageSize);
		const inlineKeyboard = paginatedTitles.map(title => {
			const titleTextInfo = [
				title.titleNameText,
				title.titleReleaseText,
				title.titleTypeText,
				title.topCredits.join(', '),
			];
			return [
				{
					text: joinIfExist(titleTextInfo, ' • '),
					callback_data: title.id,
				},
			];
		});

		const paginationButtons = [];
		if (!isFirstPage) {
			paginationButtons.push({
				text: '⬅️ Previous page',
				callback_data: `searchTerm=${searchTerm}__startIdx=${startIdx - pageSize}`,
			});
		}
		if (!isLastPage) {
			paginationButtons.push({
				text: 'Next page ➡️',
				callback_data: `searchTerm=${searchTerm}__startIdx=${startIdx + pageSize}`,
			});
		}
		inlineKeyboard.push(paginationButtons);
		await bot.editInlineKeyboard(
			callbackQuery.message.chat.id,
			callbackQuery.message.message_id,
			null,
			inlineKeyboard,
		);
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
