const buildDataloader = require('../connector/dataloaders');
const { ObjectID } = require('mongodb');

class User {
  constructor({ Users }) {
    this.Users = Users;
  }

  async authenticate(authorization) {
    const HEADER_REGEX = /bearer token-(.*)$/;
    const email = authorization && HEADER_REGEX.exec(authorization)[1];
    return email && (await this.Users.findOne({ email }));
  }

  async allUsers({ skip, limit }) {
    const cursor = this.Users.find({});
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
    const { userLoader } = buildDataloader(this);
    return await userLoader.load(objectId);
  }

  async createUser({ name, authProvider }) {
    const newUser = {
      name,
      email: authProvider.email.email,
      password: authProvider.email.password
    };

    const response = await this.Users.insert(newUser);
    return Object.assign({ id: response.insertedIds[0] }, newUser);
  }

  async signinUser({ email }) {
    const user = await this.Users.findOne({ email: email.email });
    if (email.password === user.password) {
      return { token: `token-${user.email}`, user };
    }
  }
}

module.exports = User;
