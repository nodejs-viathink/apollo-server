const DataLoader = require('dataloader');

async function batchUsers(Users, keys) {
  return await Users.find({ _id: { $in: keys } }).toArray();
}

async function batchVotes(Votes, keys) {
  return await Votes.find({ _id: { $in: keys } }).toArray();
}

async function batchLinks(Links, keys) {
  return await Links.find({ _id: { $in: keys } }).toArray();
}

module.exports = ({ Users, Votes, Links }) => ({
  userLoader: new DataLoader(keys => batchUsers(Users, keys), {
    cacheKeyFn: key => key.toString()
  }),
  voteLoader: new DataLoader(keys => batchVotes(Votes, keys), {
    cacheKeyFn: key => key.toString()
  }),
  linkLoader: new DataLoader(keys => batchLinks(Links, keys), {
    cacheKeyFn: key => key.toString()
  })
});
