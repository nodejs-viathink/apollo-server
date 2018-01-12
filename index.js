const Koa = require('koa');
const Router = require('koa-router');
const BodyParser = require('koa-bodyparser');
const logger = require('koa-logger');
const conditional = require('koa-conditional-get');
const etag = require('koa-etag');
const cors = require('@koa/cors');
const { createServer } = require('http');
const { graphqlKoa, graphiqlKoa } = require('apollo-server-koa');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');

const schema = require('./src/schema');
const connectMongo = require('./src/connector/mongo-connector');
const { User, Link, Vote } = require('./src/models');
const formatError = require('./src/helper/fomatError');

const start = async () => {
  const mongo = await connectMongo();

  const app = new Koa();
  const router = new Router();

  app.use(cors());
  app.use(conditional());
  app.use(etag());
  app.use(logger());
  app.use(BodyParser());

  router.post(
    '/graphql',
    graphqlKoa(async (req, res) => {
      const { authorization } = req.headers;
      const user = new User(mongo);
      const currentUser = await user.authenticate(authorization);
      return {
        schema,
        formatError,
        context: {
          user,
          link: new Link(mongo),
          vote: new Vote(mongo),
          currentUser
        }
      };
    })
  );

  router.get(
    '/graphiql',
    graphiqlKoa({
      endpointURL: '/graphql',
      passHeader: `'Authorization': 'bearer token-lucy@outlook.com'`,
      subscriptionsEndpoint: 'ws://localhost:4000/subscriptions'
    })
  );

  router.get('/', ctx => {
    ctx.body = 'OK!!!!';
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.on('error', err => {
    console.error('server error', err);
  });

  app.on('error', (err, ctx) => {
    console.error('server error', err, ctx);
  });

  const server = createServer(app.callback());

  server.listen(4000, () => {
    SubscriptionServer.create(
      {
        execute,
        subscribe,
        schema
      },
      {
        server,
        path: '/subscriptions'
      }
    );
    console.log('Server is running on http://localhost:4000');
    console.log('GraphiQl is running on http://localhost:4000/graphiql');
  });
};

start();
