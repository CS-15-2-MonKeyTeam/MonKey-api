const Query = require('./Query');
const Mutation = require('./Mutation');
const AuthPayload = require('./AuthPayload');
const interfaces = require('./interfaces');

module.exports = {
  Query,
  Mutation,
  AuthPayload,
  ...interfaces
};
