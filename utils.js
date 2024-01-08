const joinIfExist = (arr, separator) => arr?.filter(Boolean).join(separator);

const getNResults = (results, start, n) => results.slice(start, start + n);

module.exports = {
	joinIfExist,
	getNResults,
};
