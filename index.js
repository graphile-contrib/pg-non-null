/**
 *
 * PgNonNullPlugin
 *
 * This plugin encapsulates both the `PgNonNullRelationsPlugin` and
 * the `PgNonNullSmartCommentPlugin` plugin into one.
 *
 */

const PgNonNullSmartCommentPlugin = require('./src/PgNonNullSmartCommentPlugin');
const PgNonNullRelationsPlugin = require('./src/PgNonNullRelationsPlugin');

module.exports = function PgNonNullPlugin(builder) {
  PgNonNullSmartCommentPlugin(builder);
  PgNonNullRelationsPlugin(builder);
};
