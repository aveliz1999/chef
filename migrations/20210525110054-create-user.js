'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      githubId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED
      },
      banned: {
        allowNull: false,
        type: Sequelize.BOOLEAN
      },
      accessLevel: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED
      },
      createdAt: Sequelize.DATE(3),
      updatedAt: Sequelize.DATE(3),
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Users');
  }
};
