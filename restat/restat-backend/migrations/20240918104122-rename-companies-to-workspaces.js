'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Rename the table 'companies' to 'workspaces'
    await queryInterface.renameTable('companies', 'workspaces');
  },

  async down(queryInterface) {
    // Revert the table name from 'workspaces' back to 'companies'
    await queryInterface.renameTable('workspaces', 'companies');
  }
};
