# @graphile-contrib/pg-non-null

Plugins helping you handle fields which are non nullable. There are two plugins
within this repository:

- `PgNonNullSmartCommentPlugin`<br>
  _Allows the use of `@nonNull` smart comment to flag fields as non nullable in the resulting GraphQL schema._
- `PgNonNullRelationsPlugin`<br>
  _This plugin makes sure that fields behind foreign keys which are flagged as `NOT NULL` are also non nullable in the resulting GraphQL schema._

⚠️ Please be wary and use with caution, as these plugins influence only the **output** types! By no means do any of the plugins guarantee that Postgres will follow your manual non null overrides! ⚠️

## Installation:

```bash
npm install --save @graphile-contrib/pg-non-null
```

or

```bash
yarn add @graphile-contrib/pg-non-null
```

## Usage:

**CLI:**

Default:

```bash
postgraphile --append-plugins @graphile-contrib/pg-non-null
```

Only `PgNonNullSmartCommentPlugin`:

```bash
postgraphile --append-plugins @graphile-contrib/pg-non-null/smart-comment
```

Only `PgNonNullRelationsPlugin`:

```bash
postgraphile --append-plugins @graphile-contrib/pg-non-null/relations
```

**Library:**

```js
const PgNonNullPlugin = require('@graphile-contrib/pg-non-null');

const PgNonNullSmartCommentPlugin = require('@graphile-contrib/pg-non-null/smart-comment');
const PgNonNullRelationsPlugin = require('@graphile-contrib/pg-non-null/relations');

app.use(
  postgraphile(process.env.POSTGRES_ENDPOINT, process.env.POSTGRES_SCHEMA, {
    appendPlugins: [PgNonNullPlugin],
    // or
    appendPlugins: [PgNonNullSmartCommentPlugin, PgNonNullRelationsPlugin],
  }),
);
```

- `PgNonNullRelationsPlugin` requires no further actions as it will automatically detect not null foreign keys and mark the links as non nullable.
- `PgNonNullSmartCommentPlugin` uses the smart comment feature with the following syntax to manually infer non null states:

  - Commenting `@nonNull [field]` on a `TABLE`, `VIEW` or `TYPE` indicates that matching fields are not null.<br>

    ```sql
    CREATE TABLE private.user (
      id         serial PRIMARY KEY,
      first_name text NOT NULL,
      last_name  text,
    );
    COMMENT ON TABLE private.user IS '@nonNull last_name';
    ```

    ```sql
    CREATE OR VIEW public.user AS
      SELECT
        id,
        first_name,
        last_name
      FROM private.foo;
    COMMENT ON VIEW public.user IS E'@nonNull id\n@nonNull first_name\n@nonNull last_name';
    ```

    ```sql
    CREATE TYPE public.user AS (
      id         int,
      first_name text,
      last_name  text
    );
    COMMENT ON TYPE public.user IS $$
    @nonNull id
    @nonNull first_name
    @nonNull last_name
    $$;
    ```

  - Commenting `@nonNull` on a `COLUMN` or `FUNCTION` indicates that the field itself is not null.

    ```sql
    CREATE TABLE public.user (
      id         serial PRIMARY KEY,
      first_name text NOT NULL,
      last_name  text,
    );
    COMMENT ON COLUMN public.user.last_name IS '@nonNull';
    ```

    ```sql
    CREATE FUNCTION public.user_full_name("user" public.user) RETURNS text AS
    $$
      SELECT "user".first_name || ' ' || "user".last_name
    $$
    LANGUAGE SQL STABLE;
    COMMENT ON FUNCTION public.user_full_name IS '@nonNull';
    ```

## Example:

This SQL schema:

```sql
CREATE TABLE public.user (
  id         serial PRIMARY KEY,
  first_name text NOT NULL,
  last_name  text NOT NULL
);

CREATE TYPE public.article_state AS (
  is_public boolean,
  likes     int
);

COMMENT ON TYPE public.article_state IS $$
@nonNull is_public
@nonNull likes
$$;

CREATE TABLE public.article (
  id serial PRIMARY KEY,

  -- `userByAuthorId` link should not be null because the foreign key is not null
  author_id serial NOT NULL REFERENCES public.user(id),

  "state" public.article_state NOT NULL,

  title   text NOT NULL,
  content text
);

CREATE FUNCTION public.user_full_name("user" public.user) RETURNS text AS
$$
  SELECT "user".first_name || ' ' || "user".last_name
$$
LANGUAGE SQL STABLE;

COMMENT ON FUNCTION public.user_full_name IS '@nonNull';
```

will result in the following GraphQL schema:

```graphql
type User {
  id: Int!
  firstName: String!
  lastName: String!

  fullName: String! # NonNull derived by the `PgNonNullSmartCommentPlugin`
}

type ArticleState {
  isPublic Boolean! # NonNull derived by the `PgNonNullSmartCommentPlugin`
  likes Int! # NonNull derived by the `PgNonNullSmartCommentPlugin`
}

type Article {
  id: Int!
  authorId: Int!
  state: ArticleState!
  title: String!
  content: String

  userByAuthorId: User! # NonNull derived by the `PgNonNullRelationsPlugin`
}
```
