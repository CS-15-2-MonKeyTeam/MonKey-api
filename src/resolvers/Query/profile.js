const { getUserId } = require('../../utils');

const profile = {
  async me(parent, args, ctx, info) {
    const id = getUserId(ctx);
    return ctx.db.query.user({ where: { id } }, info);
  }
};

module.exports = profile;
