class ScrapingError extends Error {
	constructor(message) {
		super(message);
		Error.captureStackTrace(this, this.constructor);
		this.name = this.constructor.name;
	}
}

module.exports = { ScrapingError };
