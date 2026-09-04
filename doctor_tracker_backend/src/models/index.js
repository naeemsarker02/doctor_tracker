const fs = require("fs");
const path = require("path");
const { sequelize } = require("../config/database");

const basename = path.basename(__filename);
const db = {};

fs.readdirSync(__dirname)
    .filter(
        (file) =>
            file !== basename &&
            file.endsWith(".js") &&
            !file.endsWith(".test.js")
    )
    .forEach((file) => {
        const model = require(path.join(__dirname, file))(sequelize);
        db[model.name] = model;
    });

Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;

module.exports = db;
