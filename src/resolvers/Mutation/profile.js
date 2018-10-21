const { getUserId } = require('../../utils');

const profile = {
  async updateProfile(parent, { name }, ctx, info) {
    const id = getUserId(ctx);
    return ctx.db.mutation.updateUser({ data: { name }, where: { id } });
  }
};

module.exports = profile;
