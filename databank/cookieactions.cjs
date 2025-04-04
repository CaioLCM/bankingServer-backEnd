const jwt = require("jsonwebtoken")
const express = require("express")
const cookieParser = require("cookie-parser")

const app = express()
app.use(cookieParser())

function verificarToken (req, res, next){
    const token = req.cookies.authToken

    if(!token){
        return res.status(401).json({message: "Usuário não autorizado"})
    }

    try {
        const decoded = jwt.verify(token, "assinaturacaio");
        req.user = decoded;
        next();
    } catch(error){
        return res.status(403).json({message: "Token inválido"})
    }
}

function retornarEmailToken (req, res){
    const token = req.cookies.authToken
    const decoded = jwt.verify(token, "assinaturacaio")
    return decoded
}

module.exports = [verificarToken, retornarEmailToken]