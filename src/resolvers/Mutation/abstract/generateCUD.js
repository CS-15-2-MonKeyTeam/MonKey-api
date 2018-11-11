const { getUserId } = require('../../../utils');

function generateCUD(categoryName) {
  const notFoundErrorText = `${categoryName
    .replace(/([A-Z])/g, ' $1')
    .slice(1)} not found or you're not the owner.`;

  return {
    [`create${categoryName}`]: (parent, data, ctx, info) => {
      const id = getUserId(ctx);
      return ctx.db.mutation[`create${categoryName}`](
        {
          data: { ...data, owner: { connect: { id } } }
        },
        info
      );
    },

    [`update${categoryName}`]: async (parent, data, ctx, info) => {
      const userId = getUserId(ctx);
      const { id } = data;
      const accountExists = await ctx.db.exists[categoryName]({ id, owner: { id: userId } });
      if (!accountExists) {
        throw new Error(notFoundErrorText);
      }

      return ctx.db.mutation[`update$${categoryName}`](
        {
          where: { id },
          data
        },
        info
      );
    },

    [`delete${categoryName}`]: async (parent, { id }, ctx, info) => {
      const userId = getUserId(ctx);
      const accountExists = await ctx.db.exists[categoryName]({ id, owner: { id: userId } });
      if (!accountExists) {
        throw new Error(notFoundErrorText);
      }

      return ctx.db.mutation[`delete${categoryName}`]({ where: { id } }, info);
    }
  };
}

module.exports = generateCUD;
