/**
 *
 * PgNonNullSmartCommentPlugin
 *
 * This plugin allows the use of `@nonNull` smart comment
 * to flag fields as non nullable in the resulting GraphQL
 * schema.
 *
 */

module.exports = function PgNonNullSmartCommentPlugin(builder) {
  builder.hook('GraphQLObjectType:fields:field', (field, build, context) => {
    const { pgFieldIntrospection } = context.scope;
    if (!pgFieldIntrospection) {
      return field;
    }

    const {
      name: pgFieldName,
      tags: { nonNull: fieldNonNull },
    } = pgFieldIntrospection;

    // if the field itself is tagged as `nonNull`
    if (fieldNonNull === true) {
      return {
        ...field,
        type: new build.graphql.GraphQLNonNull(build.graphql.getNullableType(field.type)),
      };
    }

    const { pgIntrospection } = context.scope;
    if (!pgIntrospection) {
      return field;
    }

    const {
      tags: { nonNull: classNonNull },
      type,
    } = pgIntrospection;

    // if the field appears somewhere in the `nonNull` tag
    if (
      classNonNull &&
      (Array.isArray(classNonNull)
        ? classNonNull.indexOf(pgFieldName) > -1
        : classNonNull === pgFieldName)
    ) {
      return {
        ...field,
        type: new build.graphql.GraphQLNonNull(build.graphql.getNullableType(field.type)),
      };
    }

    if (type) {
      const {
        tags: { nonNull: typeNonNull },
      } = type;

      // if the field appears somewhere in the `nonNull` tag on the type
      if (
        typeNonNull &&
        (Array.isArray(typeNonNull)
          ? typeNonNull.indexOf(pgFieldName) > -1
          : typeNonNull === pgFieldName)
      ) {
        return {
          ...field,
          type: new build.graphql.GraphQLNonNull(build.graphql.getNullableType(field.type)),
        };
      }
    }

    return field;
  });
};
