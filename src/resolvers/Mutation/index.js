const auth = require('./auth');
const profile = require('./profile');
const account = require('./account');

const Mutation = {
  ...auth,
  ...profile,
  ...account
};

module.exports = Mutation;
