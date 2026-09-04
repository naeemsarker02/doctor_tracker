"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn("users", "avatar_url", {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn("users", "avatar_url");
    },
};
