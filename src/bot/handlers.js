const { getImdbTitle } = require('../scraper');
const { getSearchResults, getTitle } = require('../data-access/dal');
const { buildMessageFromTitle, buildPaginatedInlineKeyboard } = require('./messageBuilder');

const onStart = async (bot, messageBody) => {
	const chatId = messageBody.chat.id;
	const senderName = messageBody.from.first_name;
	await bot.sendTextMessage(
		`Hey ${senderName}, welcome to the IMDB bot. Send me the title of a movie or a TV show and I will provide you with some information and rating about it.`,
		chatId,
	);
	console.log(`Started a new chat with: ${senderName}`);
};

const onSearch = async (bot, messageBody) => {
	const unCachedAction = () => bot.sendChatAction(messageBody.chat.id, 'typing');
	const searchTerm = messageBody.text;
	console.log(`Searching for: ${searchTerm}. Sender: [ ${messageBody.from.first_name} ].`);
	const searchResults = await getSearchResults(searchTerm, unCachedAction);
	const chatId = messageBody.chat.id;
	if (!searchResults.length) {
		console.log(`No results found for: ${searchTerm}`);
		await bot.sendTextMessage('No results found', chatId);
		return;
	}
	if (searchResults.length === 1) {
		// handle single result
		console.log(`Found a single result for: ${searchTerm}`);
		const titleTxt = await getTitle(searchResults[0].id, unCachedAction);
		if (titleTxt) {
			await bot.sendTextMessage(titleTxt, chatId);
		} else {
			console.log(`No information found for: ${searchTerm}`);
			await bot.sendTextMessage('There is no information about this title', chatId);
		}
	} else {
		// handle multiple results (pagination)
		console.log(`Found multiple results for: ${searchTerm}.`);
		const inlineKeyboard = buildPaginatedInlineKeyboard(searchResults, searchTerm, 0);
		await bot.sendInlineKeyboard(chatId, 'Choose a movie or a TV show', inlineKeyboard);
	}
};

const onClickSearchResultsMenu = async (bot, callbackQuery) => {
	const unCachedAction = () => bot.sendChatAction(callbackQuery.message.chat.id, 'typing');
	const data = callbackQuery.data;
	if (data.startsWith('tt')) {
		// In that case data is the title ID
		console.log(
			`Clicked on a search result. Title ID: ${data}. Sender: [ ${callbackQuery.from.first_name} ].`,
		);
		const titleTxt = await getTitle(data, unCachedAction);
		if (!titleTxt) {
			console.log(`No information found for: ${data}`);
			await bot.sendTextMessage(
				'There is no information about this title',
				callbackQuery.message.chat.id,
			);
			return;
		}
		await bot.sendTextMessage(titleTxt, callbackQuery.message.chat.id);
		return;
	}
	if (data.startsWith('searchTerm=')) {
		// In that case data is the search term and the start index (pagination)
		console.log(
			`Clicked on a pagination button. Data: ${data}. Sender: [ ${callbackQuery.from.first_name} ].`,
		);
		const splittedData = data.split('__');
		const searchTerm = splittedData[0].split('=')[1];
		let startIdx = Number(splittedData[1].split('=')[1]);
		const searchResults = await getSearchResults(searchTerm, unCachedAction);
		const inlineKeyboard = buildPaginatedInlineKeyboard(searchResults, searchTerm, startIdx);
		await bot.editInlineKeyboard(
			callbackQuery.message.chat.id,
			callbackQuery.message.message_id,
			null,
			inlineKeyboard,
		);
	}
};

module.exports = {
	onStart,
	onSearch,
	onClickSearchResultsMenu,
};
