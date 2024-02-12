const Telenode = require('telenode-js');
const wrapper = require('./wrapper');
const { onStart, onSearch, onClickSearchResultsMenu } = require('./handlers');

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const bot = new Telenode({
	apiToken: process.env.API_TOKEN,
	secretToken: process.env.SECRET_TOKEN,
});

bot.createServer();

bot.onTextMessage('/start', messageBody => wrapper(bot, messageBody, onStart));

bot.onTextMessage('', messageBody => wrapper(bot, messageBody, onSearch));

bot.onButton('', callbackQuery => wrapper(bot, callbackQuery, onClickSearchResultsMenu));
