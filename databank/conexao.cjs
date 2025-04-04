const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "bankdata",
    password: "postgres",
    port: 5432
})

pool.connect().then(() => console.log("Conectado ao banco de dados"))

module.exports = pool;