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

// --- Auth helpers ---

function verifyToken(req, res) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token não fornecido' })
    return null
  }
  try {
    const payload = jwt.verify(auth.slice(7), SECRET)
    return payload.sub
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado' })
    return null
  }
}

function newId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 7)
}

// --- Auth routes ---

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
  const id = newId()
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

// --- Products routes (user-scoped) ---

server.get('/products', (req, res) => {
  const userId = verifyToken(req, res)
  if (!userId) return
  const products = router.db.get('products').filter({ userId }).value()
  res.json(products)
})

server.post('/products', (req, res) => {
  const userId = verifyToken(req, res)
  if (!userId) return
  const product = { ...req.body, userId, id: newId() }
  router.db.get('products').push(product).write()
  res.status(201).json(product)
})

server.put('/products/:id', (req, res) => {
  const userId = verifyToken(req, res)
  if (!userId) return
  const db = router.db
  const product = db.get('products').find({ id: req.params.id }).value()
  if (!product) return res.status(404).json({ message: 'Produto não encontrado' })
  if (product.userId !== userId) return res.status(403).json({ message: 'Acesso negado' })
  const updated = { ...req.body, id: req.params.id, userId }
  db.get('products').find({ id: req.params.id }).assign(updated).write()
  res.json(updated)
})

server.patch('/products/:id', (req, res) => {
  const userId = verifyToken(req, res)
  if (!userId) return
  const db = router.db
  const product = db.get('products').find({ id: req.params.id }).value()
  if (!product) return res.status(404).json({ message: 'Produto não encontrado' })
  if (product.userId !== userId) return res.status(403).json({ message: 'Acesso negado' })
  const updated = { ...product, ...req.body, id: req.params.id, userId }
  db.get('products').find({ id: req.params.id }).assign(updated).write()
  res.json(updated)
})

server.delete('/products/:id', (req, res) => {
  const userId = verifyToken(req, res)
  if (!userId) return
  const db = router.db
  const product = db.get('products').find({ id: req.params.id }).value()
  if (!product) return res.status(404).json({ message: 'Produto não encontrado' })
  if (product.userId !== userId) return res.status(403).json({ message: 'Acesso negado' })
  db.get('products').remove({ id: req.params.id }).write()
  res.status(200).json({})
})

// --- Categories routes (user-scoped) ---

server.get('/categories', (req, res) => {
  const userId = verifyToken(req, res)
  if (!userId) return
  const categories = router.db.get('categories').filter({ userId }).value()
  res.json(categories)
})

server.post('/categories', (req, res) => {
  const userId = verifyToken(req, res)
  if (!userId) return
  const category = { ...req.body, userId, id: newId() }
  router.db.get('categories').push(category).write()
  res.status(201).json(category)
})

server.put('/categories/:id', (req, res) => {
  const userId = verifyToken(req, res)
  if (!userId) return
  const db = router.db
  const category = db.get('categories').find({ id: req.params.id }).value()
  if (!category) return res.status(404).json({ message: 'Categoria não encontrada' })
  if (category.userId !== userId) return res.status(403).json({ message: 'Acesso negado' })
  const updated = { ...req.body, id: req.params.id, userId }
  db.get('categories').find({ id: req.params.id }).assign(updated).write()
  res.json(updated)
})

server.patch('/categories/:id', (req, res) => {
  const userId = verifyToken(req, res)
  if (!userId) return
  const db = router.db
  const category = db.get('categories').find({ id: req.params.id }).value()
  if (!category) return res.status(404).json({ message: 'Categoria não encontrada' })
  if (category.userId !== userId) return res.status(403).json({ message: 'Acesso negado' })
  const updated = { ...category, ...req.body, id: req.params.id, userId }
  db.get('categories').find({ id: req.params.id }).assign(updated).write()
  res.json(updated)
})

server.delete('/categories/:id', (req, res) => {
  const userId = verifyToken(req, res)
  if (!userId) return
  const db = router.db
  const category = db.get('categories').find({ id: req.params.id }).value()
  if (!category) return res.status(404).json({ message: 'Categoria não encontrada' })
  if (category.userId !== userId) return res.status(403).json({ message: 'Acesso negado' })
  db.get('categories').remove({ id: req.params.id }).write()
  res.status(200).json({})
})

server.use(router)

server.listen(PORT, () => {
  console.log(`JSON Server rodando em http://localhost:${PORT}`)
})
