const { URL } = require('url');

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

function assertValidLink(url) {
  try {
    new URL(url);
  } catch (error) {
    throw new ValidationError('Link validation error: invalid url.', 'url');
  }
}

function buildFilters({ OR = [], description_contains, url_contains }) {
  const filter = description_contains || url_contains ? {} : null;
  if (description_contains) {
    filter.description = { $regex: `.*${description_contains}.*` };
  }
  if (url_contains) {
    filter.url = { $regex: `.*${url_contains}.*` };
  }

  let filters = filter ? [filter] : [];
  for (let i = 0; i < OR.length; i++) {
    filters = filters.concat(buildFilters(OR[i]));
  }

  return filters;
}

module.exports = { assertValidLink, buildFilters, ValidationError };
