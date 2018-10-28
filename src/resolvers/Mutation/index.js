const auth = require('./auth');
const profile = require('./profile');

const Mutation = {
  ...auth,
  ...profile
};

module.exports = Mutation;
