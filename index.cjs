const express = require("express");
const app = express();
const path = require("path");
const [cadastrar_usuario, usuario_valido, buscar_dados, conta_bancaria, buscar_saldo, criarToken, buscarCPF, procurarEMAIL, deletarConta, mostrarDB] = require("./databank/commands.cjs");
const { cp } = require("fs");
const jwt = require("jsonwebtoken")
const [verificarToken, retornarEmailToken] = require("./databank/cookieactions.cjs");
const cookieParser = require("cookie-parser");
const { json } = require("stream/consumers");

app.use(express.json())
app.use(cookieParser())

// MENU PRINCIPAL & LOGIN
app.get("/", (req, res) => {
    const file_path = path.join(__dirname, "./htmlpages/site.html");
    res.sendFile(file_path)
})

app.post("/entrar", async (req, res) => {
    const {email_input, password_input} = req.body
    const valido = await usuario_valido(email_input, password_input)
    if (valido){
        const name = await buscar_dados(email_input)
        const saldo = await buscar_saldo(email_input)
        criarToken(res, name, email_input, saldo)
        res.status(201).json({message: "Login realizado com sucesso!"})
    }
    else {
        console.log("Login inválido!")
        res.status(401).json({message: "Erro ao efetuar o login!"})
    }
})

// CADASTRO
app.get("/cadastro", (req, res) => {
    const file_path = path.join(__dirname, "./htmlpages/cadastro.html");
    res.sendFile(file_path);
})

app.post("/cadastrar", async (req, res) => {
    const {username, cpf, email, senha} = req.body
    const cadastro = await cadastrar_usuario(username, cpf, email, senha)
    if (cadastro){res.status(201).json({message: "Usuário cadastrado com sucesso!"})}
    else{res.status(500).json({message: "Falha ao cadastrar o usuário!"})}
})

// DASHBOARD

app.get("/usuario", verificarToken, (req, res) => {
    res.json({nome: req.user.nome.name, email: req.user.email, saldo: req.user.saldo})
})

app.get("/dashboard", (req, res) => {
    const file_path = path.join(__dirname, 'htmlpages', 'dashboard.html')
    res.sendFile(file_path)
})

app.post("/logout", (req, res) => {
    res.cookie("authToken", "", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        expires: new Date(0)
    })
    res.status(200).json({message: "Logout realizado com sucesso!"})
})

app.delete("/dashboard/excluirConta", verificarToken, async (req, res) => {
    const dados = await retornarEmailToken(req, res)
    await deletarConta(dados.email)
    res.cookie("authToken", "", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        expires: new Date(0)
    })
    res.status(200).json({message: "Conta deletada com sucesso!"})
})

// FINANCEIRO

app.get("/dashboard/transferir", verificarToken, (req, res) => {
    const file_path = path.join(__dirname, "htmlpages", "transferencia.html")
    res.sendFile(file_path)
    res.status(200)
})

app.post("/dashboard/enviarValor", verificarToken, async (req, res) => {
    const email = await retornarEmailToken(req, res).email
    const valor = parseFloat(req.body.valor)
    const nome = await buscar_dados(email)
    const saldoRemetente = await buscar_saldo(email)
    const CPFdestino = req.body.cpf
    if(await buscarCPF(CPFdestino)){
        const emailDestino = await procurarEMAIL(CPFdestino)
        const saldoDestino = await buscar_saldo(emailDestino)
        const valorFinalRemetente = saldoRemetente - valor
        if(valorFinalRemetente < 0){
            res.status(400).json({message: "Valor inadequado"})
        }
        else {
            const valorFinalDestino = saldoDestino + valor
        ////////////
        await conta_bancaria(valorFinalDestino, emailDestino)
        res.cookie("authToken", "", {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
            expires: new Date(0)
        })
        await conta_bancaria(valorFinalRemetente, email)
        await criarToken(res, nome, email, valorFinalRemetente)
        res.status(201).json({message: "Sucesso ao transferir"})
        }
        
    }
})

app.get("/dashboard/depositar", verificarToken, (req, res) => {
    const file_path = path.join(__dirname, "htmlpages", "deposito.html")
    res.sendFile(file_path)
    res.status(200)
})

app.post("/dashboard/processarvalor", verificarToken, async (req, res) => {
    const email = await retornarEmailToken(req, res).email
    const valor = parseFloat(req.body.valor)
    const nome = await buscar_dados(email)
    const saldo_atual = parseFloat(await buscar_saldo(email))

    const novo_saldo = saldo_atual + valor

    await conta_bancaria(novo_saldo, email)
    res.cookie("authToken", "", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        expires: new Date(0)
    })
    await criarToken(res, nome, email, novo_saldo)
    res.status(201).json({message: "Depósito realizado com sucesso!"})
})

// DATABASE ACCESS
app.get("/database", async(req, res) => {
    res.send(`${await mostrarDB()}`)
})

// PORTA
app.listen(3000, () => {
    console.log("Server on!");
})