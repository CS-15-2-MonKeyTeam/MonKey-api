# MonKey API

Server side for MonKey project (personal finance app).

## Documentation

### Commands

- `yarn start` starts GraphQL server on `http://localhost:4000`
- `yarn dev` starts GraphQL server on `http://localhost:4000` _and_ opens GraphQL Playground
- `yarn playground` opens the GraphQL Playground for the `projects` from [`.graphqlconfig.yml`](./.graphqlconfig.yml)
- `yarn prisma <subcommand>` gives access to local version of Prisma CLI (e.g. `yarn prisma deploy`)

> **Note**: We recommend that you're using `yarn dev` during development as it will give you access to the GraphQL API or your server (defined by the [application schema](./src/schema.graphql)) as well as to the Prisma API directly (defined by the [Prisma database schema](./src/generated/prisma.graphql)). If you're starting the server with `yarn start`, you'll only be able to access the API of the application schema.
