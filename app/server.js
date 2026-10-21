const express = require('express');
const path = require('path');
const pool = require('./db');
const {
  registry,
  logEvent,
  requestLogger
} = require('./monitoring');

const app = express();

app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(requestLogger);
app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Nginx la reverse proxy duy nhat dung truoc ung dung.
app.set('trust proxy', 1);

const session = require('express-session');
const authRouter = require('./auth');

if (!process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must contain at least 32 characters');
}

app.use('/admin', session({
  name: 'recipe.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 30 * 60 * 1000
  }
}));

app.use('/admin', authRouter);
app.use('/admin', require('./admin'));


const asyncRoute = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/health', asyncRoute(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'connected' });
}));

app.get('/metrics', asyncRoute(async (req, res) => {
  res.set('Content-Type', registry.contentType);
  res.send(await registry.metrics());
}));

app.get('/', asyncRoute(async (req, res) => {
  const q = typeof req.query.q === 'string'
    ? req.query.q.trim().slice(0, 100) : '';

  const category = typeof req.query.category === 'string'
    ? req.query.category : '';

  const [categories] = await pool.execute(
    'SELECT id, name FROM categories ORDER BY id'
  );

  const conditions = [];
  const params = [];

  if (q) {
    conditions.push('(r.title LIKE ? OR r.ingredients LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }

  if (/^[1-9]\d{0,9}$/.test(category)) {
    conditions.push('r.category_id = ?');
    params.push(Number(category));
  }

  const where = conditions.length
    ? ' WHERE ' + conditions.join(' AND ') : '';

  const [recipes] = await pool.execute(
    `SELECT r.*, c.name AS category_name
     FROM recipes r
     JOIN categories c ON c.id = r.category_id
     ${where}
     ORDER BY r.id DESC
     LIMIT 100`,
    params
  );

  res.render('index', { recipes, categories, q, category });
}));

app.get('/recipes/:id', asyncRoute(async (req, res) => {
  if (!/^[1-9]\d{0,9}$/.test(req.params.id)) {
    return res.status(404).send('Không tìm thấy công thức.');
  }

  const [rows] = await pool.execute(
    `SELECT r.*, c.name AS category_name
     FROM recipes r
     JOIN categories c ON c.id = r.category_id
     WHERE r.id = ?`,
    [Number(req.params.id)]
  );

  if (!rows.length) {
    return res.status(404).send('Không tìm thấy công thức.');
  }

  res.render('detail', { recipe: rows[0] });
}));

app.use((req, res) => {
  res.status(404).send('Không tìm thấy trang.');
});

app.use((err, req, res, next) => {
  logEvent('application_error', {
    method: req.method,
    path: req.path,
    code: err.code || 'APP_ERROR'
  });

  res.status(500).send('Có lỗi xử lý. Vui lòng thử lại sau.');
});

const port = Number(process.env.PORT || 3000);

app.listen(port, '0.0.0.0', () => {
  logEvent('application_started', { port });
});
