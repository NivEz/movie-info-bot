const wrapper = async (bot, data, handler) => {
	try {
		await handler(bot, data);
	} catch (error) {
		console.error(error);
		const chatId = data?.chat?.id || data?.message?.chat?.id;
		if (chatId) {
			await bot.sendTextMessage('Something went wrong, please try again later...', chatId);
		}
	}
};

module.exports = wrapper;
