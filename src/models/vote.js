const buildDataloader = require('../connector/dataloaders');
const { ObjectID } = require('mongodb');

class Vote {
  constructor({ Votes }) {
    this.Votes = Votes;
  }

  async allVotes({ skip, limit }) {
    const cursor = this.Votes.find({});
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
    const { voteLoader } = buildDataloader(this);
    return await voteLoader.load(objectId);
  }

  async createVote({ linkId }, user) {
    const newVote = Object.assign({
      link: new ObjectID(linkId),
      user: user && user._id
    });
    const response = await this.Votes.insert(newVote);
    return Object.assign({ id: response.insertedIds[0] }, newVote);
  }

  async findByLink(linkId) {
    return await this.Votes.find({ link: linkId }).toArray();
  }

  async findByUser(userId) {
    return await this.Votes.find({ user: userId }).toArray();
  }
}

module.exports = Vote;
