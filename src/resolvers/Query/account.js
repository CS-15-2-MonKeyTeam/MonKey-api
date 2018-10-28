const { getUserId } = require('../../utils');

const account = {
  accounts(parent, args, ctx, info) {
    const id = getUserId(ctx);
    return ctx.db.query.accounts({ where: { owner: { id } } }, info);
  }
};

module.exports = account;
