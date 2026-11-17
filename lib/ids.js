const { nanoid } = require("nanoid");

const id = (prefix) => `${prefix}_${nanoid(12)}`;

module.exports = { id };
