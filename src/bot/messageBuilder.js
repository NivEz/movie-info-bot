const { joinIfExist, getNResults } = require('../utils');

const pageSize = 5;

const buildMessageFromTitle = title => {
	const titleData = title?.aboveTheFoldData;
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
	const imdbUrl = `https://www.imdb.com/title/${titleData.id}`;
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

const buildInlineKeyboardFromResults = paginatedTitles => {
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
	return inlineKeyboard;
};

const buildPaginatedInlineKeyboard = (searchResults, searchTerm, startIdx) => {
	const paginatedTitles = getNResults(searchResults, startIdx, pageSize);
	const isFirstPage = startIdx <= 0; // should be === but <= for edge cases
	const isLastPage = searchResults.length - pageSize <= startIdx;
	if (isFirstPage) {
		startIdx = 0;
	}
	const inlineKeyboard = buildInlineKeyboardFromResults(paginatedTitles);

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

	return inlineKeyboard;
};

module.exports = {
	buildMessageFromTitle,
	buildPaginatedInlineKeyboard,
};
