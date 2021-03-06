module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'Players', {
      // main fields
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      alias: { type: Sequelize.STRING },
      transferListed: { type: Sequelize.BOOLEAN, defaultValue: false },
      transferValue: { type: Sequelize.INTEGER, defaultValue: 0 },
      monthlyWages: { type: Sequelize.INTEGER, defaultValue: 0 },
      eligibleDate: { type: Sequelize.DATEONLY, allowNull: true },
      tier: Sequelize.INTEGER,
      starter: Sequelize.BOOLEAN,
      stats: { type: Sequelize.JSON, allowNull: true },

      // timestamps
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },

      // foreign keys
      teamId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'teams',
          key: 'id'
        }
      },
      countryId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'countries',
          key: 'id'
        }
      },
    });
  },
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'Players' );
  }
};
