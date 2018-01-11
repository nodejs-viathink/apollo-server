const { ObjectID } = require('mongodb');
const { URL } = require('url');

const pubsub = require('../pubsub');

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

function assertValidLink({ url }) {
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

module.exports = {
  /* Query: {
    allLinks: () => links
  },
  Mutation: {
    createLink: (_, data) => {
      const newLink = Object.assign({id: links.length + 1}, data);
      links.push(newLink);
      return newLink;
    }
  } */
  Query: {
    allLinks: async (root, { filter, skip, limit }, { mongo: { Links } }) => {
      let query = filter ? { $or: buildFilters(filter) } : {};
      const cursor = Links.find(query);
      if (skip) {
        cursor.skip(skip);
      }
      if (limit) {
        cursor.limit(limit);
      }
      return await cursor.toArray();
    },
    allUsers: async (root, { skip, limit }, { mongo: { Users } }) => {
      const cursor = Users.find({});
      if (skip) {
        cursor.skip(skip);
      }
      if (limit) {
        cursor.limit(limit);
      }
      return await cursor.toArray();
    },
    allVotes: async (root, { skip, limit }, { mongo: { Votes } }) => {
      const cursor = Votes.find({});
      if (skip) {
        cursor.skip(skip);
      }
      if (limit) {
        cursor.limit(limit);
      }
      return await cursor.toArray();
    },
    link: async (root, { id }, { dataLoaders: { linkLoader } }) => {
      return await linkLoader.load(new ObjectID(id));
    },
    user: async (root, { id }, { dataLoaders: { userLoader } }) => {
      return await userLoader.load(new ObjectID(id));
    },
    vote: async (root, { id }, { dataLoaders: { voteLoader } }) => {
      return await voteLoader.load(new ObjectID(id));
    }
  },
  Mutation: {
    createLink: async (root, data, { mongo: { Links }, user }) => {
      assertValidLink(data);
      const newLink = Object.assign({ postedById: user && user._id }, data);
      const response = await Links.insert(newLink);

      newLink.id = response.insertedIds[0];
      pubsub.publish('Link', { Link: { mutation: 'CREATED', node: newLink } });

      return newLink;
    },
    createUser: async (root, data, { mongo: { Users } }) => {
      const newUser = {
        name: data.name,
        email: data.authProvider.email.email,
        password: data.authProvider.email.password
      };

      const response = await Users.insert(newUser);
      return Object.assign({ id: response.insertedIds[0] }, newUser);
    },
    signinUser: async (root, data, { mongo: { Users } }) => {
      const user = await Users.findOne({ email: data.email.email });
      if (data.email.password === user.password) {
        return { token: `token-${user.email}`, user };
      }
    },
    createVote: async (root, data, { mongo: { Votes }, user }) => {
      const newVote = Object.assign({
        link: new ObjectID(data.linkId),
        user: user && user._id
      });
      const response = await Votes.insert(newVote);
      return Object.assign({ id: response.insertedIds[0] }, newVote);
    }
  },
  Link: {
    id: root => root._id || root.id,
    postedBy: async ({ postedById }, data, { dataLoaders: { userLoader } }) => {
      if (postedById) {
        return await userLoader.load(postedById);
      }
    },
    votes: async ({ _id }, data, { mongo: { Votes } }) => {
      return await Votes.find({ link: _id }).toArray();
    }
  },
  User: {
    id: root => root._id || root.id,
    votes: async ({ _id }, data, { mongo: { Votes } }) => {
      return await Votes.find({ user: _id }).toArray();
    }
  },
  Vote: {
    id: root => root._id || root.id,
    user: async ({ user }, data, { dataLoaders: { userLoader } }) => {
      return await userLoader.load(user);
    },
    link: async ({ link }, data, { dataLoaders: { linkLoader } }) => {
      return await linkLoader.load(link);
    }
  },
  Subscription: {
    Link: {
      subscribe: () => pubsub.asyncIterator('Link')
    }
  }
};
