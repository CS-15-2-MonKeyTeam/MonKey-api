const Query = require('./Query');
const auth = require('./Mutation/auth');
const profile = require('./Mutation/profile');
const AuthPayload = require('./AuthPayload');

module.exports = {
  Query,
  Mutation: {
    ...auth,
    ...profile
  },
  AuthPayload
};
