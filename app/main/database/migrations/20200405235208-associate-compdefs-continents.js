module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'CompdefContinents', {
      compdefId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      continentId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'CompdefContinents' );
  }
};
