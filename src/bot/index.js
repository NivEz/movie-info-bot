const Telenode = require('telenode-js');
const { getImdbSearchResults, getImdbTitle } = require('../scraper');
const { buildMessageFromTitle, buildPaginatedInlineKeyboard } = require('./messageBuilder');

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const bot = new Telenode({
	apiToken: process.env.API_TOKEN,
});

bot.createServer();

bot.onTextMessage('/start', async messageBody => {
	const chatId = messageBody.chat.id;
	await bot.sendTextMessage(
		'Welcome to the IMDB bot. Send me the title of a movie or a TV show and I will provide you with some information and rating about it.',
		chatId,
	);
});

bot.onTextMessage('', async messageBody => {
	const searchTerm = messageBody.text;
	const searchResults = await getImdbSearchResults(searchTerm);
	const chatId = messageBody.chat.id;
	if (!searchResults.length) {
		await bot.sendTextMessage('No results found', chatId);
		return;
	}
	if (searchResults.length === 1) {
		// handle single result
		const title = await getImdbTitle(searchResults[0].id);
		const message = buildMessageFromTitle(title);
		if (!message) {
			await bot.sendTextMessage('There is no information about this title', chatId);
		}
	} else {
		// handle multiple results (pagination)
		const inlineKeyboard = buildPaginatedInlineKeyboard(searchResults, searchTerm, 0);
		await bot.sendInlineKeyboard(chatId, 'Choose a movie or a TV show', inlineKeyboard);
	}
});

// handling search results
bot.onButton('', async callbackQuery => {
	const data = callbackQuery.data;
	if (data.startsWith('tt')) {
		// In that case data is the title ID
		const title = await getImdbTitle(data);
		const message = buildMessageFromTitle(title);
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
		const inlineKeyboard = buildPaginatedInlineKeyboard(searchResults, searchTerm, startIdx);
		await bot.editInlineKeyboard(
			callbackQuery.message.chat.id,
			callbackQuery.message.message_id,
			null,
			inlineKeyboard,
		);
	}
});
