const jsonServer = require('json-server')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const SECRET = 'dashboard-secret-key'
const PORT = 3001

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

server.use(middlewares)
server.use(jsonServer.bodyParser)

server.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' })
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres' })
  }

  const db = router.db
  const existing = db.get('users').find({ email }).value()

  if (existing) {
    return res.status(400).json({ message: 'Este email já está cadastrado' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const id = Date.now().toString()
  const user = { id, name, email, password: hashedPassword }

  db.get('users').push(user).write()

  const token = jwt.sign({ sub: id }, SECRET, { expiresIn: '1d' })
  return res.status(201).json({
    accessToken: token,
    user: { id, name, email },
  })
})

server.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' })
  }

  const db = router.db
  const user = db.get('users').find({ email }).value()

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Email ou senha inválidos' })
  }

  const token = jwt.sign({ sub: user.id }, SECRET, { expiresIn: '1d' })
  return res.status(200).json({
    accessToken: token,
    user: { id: user.id, name: user.name, email: user.email },
  })
})

server.use(router)

server.listen(PORT, () => {
  console.log(`JSON Server rodando em http://localhost:${PORT}`)
})
