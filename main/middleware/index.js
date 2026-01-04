/**
 * Middleware Module Index
 */

const authMiddleware = require('./authMiddleware');

module.exports = {
    ...authMiddleware
};
