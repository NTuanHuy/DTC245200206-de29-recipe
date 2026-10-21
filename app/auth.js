const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('./db');
const { loginFailures, logEvent } = require('./monitoring');

const router = express.Router();
const dummyHash = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 12);

const asyncRoute = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');

  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  res.locals.csrfToken = req.session.csrfToken;

  if (req.method === 'POST') {
    const supplied = req.body._csrf;
    const expected = req.session.csrfToken;

    if (
      typeof supplied !== 'string' ||
      Buffer.byteLength(supplied, 'utf8') !== Buffer.byteLength(expected, 'utf8') ||
      !crypto.timingSafeEqual(
        Buffer.from(supplied),
        Buffer.from(expected)
      )
    ) {
      return res.status(403).send('Phiên biểu mẫu không hợp lệ. Hãy tải lại trang.');
    }
  }

  next();
});

router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/admin');
  }

  res.render('login', { error: null });
});

router.post('/login', asyncRoute(async (req, res) => {
  const username = typeof req.body.username === 'string'
    ? req.body.username.trim().slice(0, 50) : '';

  const password = typeof req.body.password === 'string'
    ? req.body.password : '';

  let user;
  let valid = false;

  if (username && password && Buffer.byteLength(password, 'utf8') <= 72) {
    const [rows] = await pool.execute(
      'SELECT id, username, password_hash FROM users WHERE username = ?',
      [username]
    );

    user = rows[0];

    const matches = await bcrypt.compare(
      password,
      user ? user.password_hash : dummyHash
    );

    valid = Boolean(user && matches);
  }

  if (!valid) {
    loginFailures.inc();

    logEvent('login_failed', {
      username,
      ip: req.ip,
      path: req.baseUrl + req.path
    });

    return res.status(401).render('login', {
      error: 'Tên đăng nhập hoặc mật khẩu không đúng.'
    });
  }

  await new Promise((resolve, reject) => {
    req.session.regenerate(err => err ? reject(err) : resolve());
  });

  req.session.user = { id: user.id, username: user.username };
  req.session.csrfToken = crypto.randomBytes(32).toString('hex');

  await new Promise((resolve, reject) => {
    req.session.save(err => err ? reject(err) : resolve());
  });

  logEvent('login_success', {
    user_id: user.id,
    username: user.username,
    ip: req.ip
  });

  res.redirect('/admin');
}));

router.post('/logout', (req, res, next) => {
  const user = req.session.user;

  req.session.destroy(err => {
    if (err) return next(err);

    res.clearCookie('recipe.sid', { path: '/' });
    logEvent('logout', { user_id: user?.id, ip: req.ip });
    res.redirect('/admin/login');
  });
});

router.use((req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/admin/login');
  }

  res.locals.currentUser = req.session.user;
  next();
});

module.exports = router;
