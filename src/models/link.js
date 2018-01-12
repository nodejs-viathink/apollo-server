const buildDataloader = require('../connector/dataloaders');
const { ObjectID } = require('mongodb');
const { buildFilters, assertValidLink } = require('../helper');

class Link {
  constructor({ Links }) {
    this.Links = Links;
  }

  async allLinks({ filter, skip, limit }) {
    let query = filter ? { $or: buildFilters(filter) } : {};
    const cursor = this.Links.find(query);
    if (skip) {
      cursor.skip(skip);
    }
    if (limit) {
      cursor.limit(limit);
    }
    return await cursor.toArray();
  }

  async load({ id }) {
    const objectId = typeof id === 'string' ? new ObjectID(id) : id;
    const { linkLoader } = buildDataloader(this);
    return await linkLoader.load(objectId);
  }

  async createLink(link, user) {
    assertValidLink(link.url);
    const newLink = Object.assign({ postedById: user && user._id }, link);

    const response = await this.Links.insert(newLink);
    newLink.id = response.insertedIds[0];
    return newLink;
  }
}

module.exports = Link;
