const { AsyncLocalStorage } = require('async_hooks');

// Singleton ALS — propagates { companyId, scope } across all async hops in a request
const tenantStorage = new AsyncLocalStorage();

module.exports = tenantStorage;
