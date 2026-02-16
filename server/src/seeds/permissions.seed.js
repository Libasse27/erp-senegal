const { MODULES, ACTIONS } = require('../config/constants');

/**
 * Generer toutes les permissions CRUD par module
 */
const generatePermissions = () => {
  const permissions = [];

  MODULES.forEach((module) => {
    ACTIONS.forEach((action) => {
      permissions.push({
        module,
        action,
        code: `${module}:${action}`,
        description: `Peut ${action} les ${module}`,
      });
    });
  });

  return permissions;
};

module.exports = generatePermissions;
