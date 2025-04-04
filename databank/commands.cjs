const pool = require("./conexao.cjs")
const jwt = require("jsonwebtoken")


async function cadastrar_usuario(name, CPF, email, senha){
    try{
        await pool.query(`INSERT INTO users (name, email, password, cpf, dinheiro) VALUES ($1, $2, $3, $4, $5)`, [`${name}`, `${email}`, `${senha}`, `${CPF}`, 0])
        return true    
    } catch(erro){
            console.log("erro!!!: ", erro)
            return false
        }
}

async function usuario_valido(email, senha) {
    console.log(`email: ${email}. senha: ${senha}`)
    const verificar = await pool.query(`SELECT * FROM users WHERE email = $1 AND password = $2`, [`${email}`, `${senha}`])
    if (verificar.rows.length > 0){
        return true
    }
    else {
        return false
}
}

async function buscar_dados(email) {
    const usuario = await pool.query(`SELECT name FROM users WHERE email = $1`, [`${email}`])
    return usuario.rows[0]
}

async function buscar_saldo(email) {
    const usuario = await pool.query(`SELECT dinheiro FROM users WHERE email = $1`, [`${email}`])
    return usuario.rows[0].dinheiro
}

async function conta_bancaria(valor, email) {
    await pool.query(`UPDATE users SET dinheiro = $1 WHERE email = $2`, [`${valor}`, `${email}`])
}

async function buscarCPF(cpf) {
    const response = await pool.query(`SELECT * FROM users WHERE cpf = $1`, [`${cpf}`])
    if (response.rows.length > 0){return true}
}

async function procurarEMAIL(cpf) {
    const response = await pool.query(`SELECT email FROM users WHERE cpf = $1`, [`${cpf}`])
    if(response.rows.length > 0){return response.rows[0].email}
}

async function deletarConta(email) {
    console.log(email)
    await pool.query(`DELETE FROM users WHERE email = $1`, [`${email}`])
}

async function mostrarDB() {
    const db = await pool.query(`SELECT * FROM users`)
    let retornoHTML = ""
    for (let i = 0; i < db.rows.length; i++){
        retornoHTML += `<h3>Usuário: ${db.rows[i].name} || Email: ${db.rows[i].email} || Senha: ${db.rows[i].password} || CPF: ${db.rows[i].cpf} || Saldo: ${db.rows[i].dinheiro}</h3><br>`
    }
    console.log(retornoHTML)
    return retornoHTML
}

async function criarToken(res, nome, email, saldo) {
    const token = jwt.sign({"nome": nome, "email": email, "saldo": saldo}, "assinaturacaio", {expiresIn: "1h"})
        res.cookie("authToken", token, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict"
        })
}

module.exports = [cadastrar_usuario, usuario_valido, buscar_dados, conta_bancaria, buscar_saldo, criarToken, buscarCPF, procurarEMAIL, deletarConta, mostrarDB]