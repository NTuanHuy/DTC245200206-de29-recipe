const express = require('express');
const pool = require('./db');
const { logEvent } = require('./monitoring');

const router = express.Router();

const asyncRoute = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use((req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/admin/login');
  }
  next();
});

async function getCategories() {
  const [rows] = await pool.execute(
    'SELECT id, name FROM categories ORDER BY id'
  );
  return rows;
}

function readRecipe(body) {
  const text = key =>
    typeof body[key] === 'string' ? body[key].trim() : '';

  return {
    title: text('title'),
    description: text('description'),
    ingredients: text('ingredients'),
    instructions: text('instructions'),
    category_id: text('category_id'),
    cooking_minutes: text('cooking_minutes'),
    servings: text('servings')
  };
}

function validateRecipe(recipe, categories) {
  const errors = [];

  if (!recipe.title || recipe.title.length > 200) {
    errors.push('Tên món phải có từ 1 đến 200 ký tự.');
  }

  for (const [field, label] of [
    ['description', 'Mô tả'],
    ['ingredients', 'Nguyên liệu'],
    ['instructions', 'Cách thực hiện']
  ]) {
    if (!recipe[field] || recipe[field].length > 5000) {
      errors.push(`${label} phải có từ 1 đến 5000 ký tự.`);
    }
  }

  if (!categories.some(c => String(c.id) === recipe.category_id)) {
    errors.push('Hãy chọn danh mục hợp lệ.');
  }

  for (const [field, label, max] of [
    ['cooking_minutes', 'Thời gian nấu', 1440],
    ['servings', 'Khẩu phần', 100]
  ]) {
    const value = recipe[field];
    if (!/^[1-9]\d*$/.test(value) || Number(value) > max) {
      errors.push(`${label} phải là số nguyên từ 1 đến ${max}.`);
    }
  }

  return errors;
}

router.get('/', asyncRoute(async (req, res) => {
  const [recipes] = await pool.execute(
    `SELECT r.id, r.title, r.cooking_minutes,
            c.name AS category_name
     FROM recipes r
     JOIN categories c ON c.id = r.category_id
     ORDER BY r.id DESC`
  );

  res.render('admin', { recipes });
}));

router.get('/recipes/new', asyncRoute(async (req, res) => {
  const categories = await getCategories();

  res.render('recipe-form', {
    pageTitle: 'Thêm công thức',
    action: '/admin/recipes',
    recipe: {
      title: '',
      description: '',
      ingredients: '',
      instructions: '',
      category_id: '',
      cooking_minutes: '30',
      servings: '2'
    },
    categories,
    errors: []
  });
}));

router.post('/recipes', asyncRoute(async (req, res) => {
  const categories = await getCategories();
  const recipe = readRecipe(req.body);
  const errors = validateRecipe(recipe, categories);

  if (errors.length) {
    return res.status(400).render('recipe-form', {
      pageTitle: 'Thêm công thức',
      action: '/admin/recipes',
      recipe,
      categories,
      errors
    });
  }

  const [result] = await pool.execute(
    `INSERT INTO recipes
       (category_id, title, description, ingredients,
        instructions, cooking_minutes, servings)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      Number(recipe.category_id),
      recipe.title,
      recipe.description,
      recipe.ingredients,
      recipe.instructions,
      Number(recipe.cooking_minutes),
      Number(recipe.servings)
    ]
  );

  logEvent('recipe_created', {
    recipe_id: result.insertId,
    user_id: req.session.user.id,
    ip: req.ip
  });

  res.redirect('/admin');
}));


router.get('/recipes/:id/edit', asyncRoute(async (req, res) => {
  if (!/^[1-9]\d{0,9}$/.test(req.params.id)) {
    return res.status(404).send('Không tìm thấy công thức.');
  }

  const [rows] = await pool.execute(
    'SELECT * FROM recipes WHERE id = ?',
    [Number(req.params.id)]
  );

  if (!rows.length) {
    return res.status(404).send('Không tìm thấy công thức.');
  }

  res.render('recipe-form', {
    pageTitle: 'Sửa công thức',
    action: `/admin/recipes/${rows[0].id}/edit`,
    recipe: rows[0],
    categories: await getCategories(),
    errors: []
  });
}));

router.post('/recipes/:id/edit', asyncRoute(async (req, res) => {
  if (!/^[1-9]\d{0,9}$/.test(req.params.id)) {
    return res.status(404).send('Không tìm thấy công thức.');
  }

  const id = Number(req.params.id);
  const [rows] = await pool.execute(
    'SELECT id FROM recipes WHERE id = ?',
    [id]
  );

  if (!rows.length) {
    return res.status(404).send('Không tìm thấy công thức.');
  }

  const categories = await getCategories();
  const recipe = readRecipe(req.body);
  const errors = validateRecipe(recipe, categories);

  if (errors.length) {
    return res.status(400).render('recipe-form', {
      pageTitle: 'Sửa công thức',
      action: `/admin/recipes/${id}/edit`,
      recipe,
      categories,
      errors
    });
  }

  await pool.execute(
    `UPDATE recipes
     SET category_id = ?, title = ?, description = ?,
         ingredients = ?, instructions = ?,
         cooking_minutes = ?, servings = ?
     WHERE id = ?`,
    [
      Number(recipe.category_id),
      recipe.title,
      recipe.description,
      recipe.ingredients,
      recipe.instructions,
      Number(recipe.cooking_minutes),
      Number(recipe.servings),
      id
    ]
  );

  logEvent('recipe_updated', {
    recipe_id: id,
    user_id: req.session.user.id,
    ip: req.ip
  });

  res.redirect('/admin');
}));


router.get('/recipes/:id/delete', asyncRoute(async (req, res) => {
  if (!/^[1-9]\d{0,9}$/.test(req.params.id)) {
    return res.status(404).send('Không tìm thấy công thức.');
  }

  const [rows] = await pool.execute(
    'SELECT id, title FROM recipes WHERE id = ?',
    [Number(req.params.id)]
  );

  if (!rows.length) {
    return res.status(404).send('Không tìm thấy công thức.');
  }

  res.render('recipe-delete', { recipe: rows[0] });
}));

router.post('/recipes/:id/delete', asyncRoute(async (req, res) => {
  if (!/^[1-9]\d{0,9}$/.test(req.params.id)) {
    return res.status(404).send('Không tìm thấy công thức.');
  }

  const id = Number(req.params.id);

  const [result] = await pool.execute(
    'DELETE FROM recipes WHERE id = ?',
    [id]
  );

  if (!result.affectedRows) {
    return res.status(404).send('Không tìm thấy công thức.');
  }

  logEvent('recipe_deleted', {
    recipe_id: id,
    user_id: req.session.user.id,
    ip: req.ip
  });

  res.redirect('/admin');
}));


async function showCategories(res, error = null, status = 200) {
  const [categories] = await pool.execute(
    `SELECT c.id, c.name, COUNT(r.id) AS recipe_count
     FROM categories c
     LEFT JOIN recipes r ON r.category_id = c.id
     GROUP BY c.id, c.name
     ORDER BY c.id`
  );

  return res.status(status).render('categories', { categories, error });
}

function categoryName(body) {
  return typeof body.name === 'string' ? body.name.trim() : '';
}

router.get('/categories', asyncRoute(async (req, res) => {
  await showCategories(res);
}));

router.post('/categories', asyncRoute(async (req, res) => {
  const name = categoryName(req.body);

  if (!name || name.length > 100) {
    return showCategories(res, 'Tên danh mục phải có từ 1 đến 100 ký tự.', 400);
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO categories (name) VALUES (?)',
      [name]
    );

    logEvent('category_created', {
      category_id: result.insertId,
      user_id: req.session.user.id,
      ip: req.ip
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return showCategories(res, 'Tên danh mục đã tồn tại.', 400);
    }
    throw err;
  }

  res.redirect('/admin/categories');
}));

router.post('/categories/:id/edit', asyncRoute(async (req, res) => {
  if (!/^[1-9]\d{0,9}$/.test(req.params.id)) {
    return res.status(404).send('Không tìm thấy danh mục.');
  }

  const id = Number(req.params.id);
  const name = categoryName(req.body);

  if (!name || name.length > 100) {
    return showCategories(res, 'Tên danh mục phải có từ 1 đến 100 ký tự.', 400);
  }

  const [rows] = await pool.execute(
    'SELECT id FROM categories WHERE id = ?',
    [id]
  );

  if (!rows.length) {
    return res.status(404).send('Không tìm thấy danh mục.');
  }

  try {
    await pool.execute(
      'UPDATE categories SET name = ? WHERE id = ?',
      [name, id]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return showCategories(res, 'Tên danh mục đã tồn tại.', 400);
    }
    throw err;
  }

  logEvent('category_updated', {
    category_id: id,
    user_id: req.session.user.id,
    ip: req.ip
  });

  res.redirect('/admin/categories');
}));

router.post('/categories/:id/delete', asyncRoute(async (req, res) => {
  if (!/^[1-9]\d{0,9}$/.test(req.params.id)) {
    return res.status(404).send('Không tìm thấy danh mục.');
  }

  const id = Number(req.params.id);

  try {
    const [result] = await pool.execute(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).send('Không tìm thấy danh mục.');
    }
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return showCategories(
        res,
        'Danh mục đang có công thức. Hãy chuyển công thức sang danh mục khác trước.',
        400
      );
    }
    throw err;
  }

  logEvent('category_deleted', {
    category_id: id,
    user_id: req.session.user.id,
    ip: req.ip
  });

  res.redirect('/admin/categories');
}));

module.exports = router;
