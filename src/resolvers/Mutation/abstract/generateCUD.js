const R = require('ramda');

const { getUserId } = require('../../../utils');

function generateCUD(entityName) {
  const notFoundErrorText = `${entityName
    .replace(/([A-Z])/g, ' $1')
    .slice(1)} not found or you're not the owner.`;

  return {
    [`create${entityName}`]: (parent, data, ctx, info) => {
      const id = getUserId(ctx);
      return ctx.db.mutation[`create${entityName}`](
        {
          data: { ...data, owner: { connect: { id } } }
        },
        info
      );
    },

    [`update${entityName}`]: async (parent, data, ctx, info) => {
      const userId = getUserId(ctx);
      const { id } = data;
      const accountExists = await ctx.db.exists[entityName]({ id, owner: { id: userId } });
      if (!accountExists) {
        throw new Error(notFoundErrorText);
      }

      return ctx.db.mutation[`update${entityName}`](
        {
          where: { id },
          data: R.omit(['id'], data)
        },
        info
      );
    },

    [`delete${entityName}`]: async (parent, { id }, ctx, info) => {
      const userId = getUserId(ctx);
      const accountExists = await ctx.db.exists[entityName]({ id, owner: { id: userId } });
      if (!accountExists) {
        throw new Error(notFoundErrorText);
      }

      return ctx.db.mutation[`delete${entityName}`]({ where: { id } }, info);
    }
  };
}

module.exports = generateCUD;
