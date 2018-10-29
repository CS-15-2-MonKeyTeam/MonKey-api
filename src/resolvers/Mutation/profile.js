const { getUserId } = require('../../utils');

const profile = {
  updateProfile(parent, { name }, ctx, info) {
    const id = getUserId(ctx);
    return ctx.db.mutation.updateUser({ data: { name }, where: { id } }, info);
  }
};

module.exports = profile;
