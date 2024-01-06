const Telenode = require('telenode-js');

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const bot = new Telenode({
	apiToken: process.env.API_TOKEN,
});

bot.createServer();

bot.onTextMessage('hello', async messageBody => {
	console.log(messageBody);
	await bot.sendTextMessage('hello back', messageBody.chat.id);
});
