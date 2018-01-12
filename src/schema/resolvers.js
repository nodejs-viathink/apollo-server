const pubsub = require('../helper/pubsub');

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
    allLinks: async (root, args, ctx) => {
      return await ctx.link.allLinks(args);
    },
    allUsers: async (root, args, ctx) => {
      return await ctx.user.allUsers(args);
    },
    allVotes: async (root, args, ctx) => {
      return await ctx.vote.allVotes(args);
    },
    link: async (root, args, ctx) => {
      return await ctx.link.load(args);
    },
    user: async (root, args, ctx) => {
      return await ctx.user.load(args);
    },
    vote: async (root, args, ctx) => {
      return await ctx.vote.load(args);
    }
  },
  Mutation: {
    createLink: async (root, args, { link, currentUser }) => {
      const newLink = await link.createLink(args, currentUser);
      pubsub.publish('Link', { Link: { mutation: 'CREATED', node: newLink } });

      return newLink;
    },
    createUser: async (root, args, ctx) => {
      return await ctx.user.createUser(args);
    },
    signinUser: async (root, args, ctx) => {
      return await ctx.user.signinUser(args);
    },
    createVote: async (root, args, { vote, currentUser }) => {
      return await vote.createVote(args, currentUser);
    }
  },
  Link: {
    id: root => root._id || root.id,
    postedBy: async ({ postedById }, args, ctx) => {
      if (postedById) {
        return await ctx.user.load({ id: postedById });
      }
    },
    votes: async ({ _id }, args, ctx) => {
      return await ctx.vote.findByLink(_id);
    }
  },
  User: {
    id: root => root._id || root.id,
    votes: async ({ _id }, args, ctx) => {
      return await ctx.vote.findByUser(_id);
    }
  },
  Vote: {
    id: root => root._id || root.id,
    user: async ({ user }, args, ctx) => {
      return await ctx.user.load({ id: user });
    },
    link: async ({ link }, args, ctx) => {
      return await ctx.link.load({ id: link });
    }
  },
  Subscription: {
    Link: {
      subscribe: () => pubsub.asyncIterator('Link')
    }
  }
};
