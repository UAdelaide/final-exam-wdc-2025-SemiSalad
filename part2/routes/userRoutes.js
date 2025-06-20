const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

// POST login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query(`
      SELECT user_id, username, role FROM Users
      WHERE email = ? AND password_hash = ?
    `, [email, password]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.user = rows[0]; // adds user to the session

    res.json({ message: 'Login successful', user: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // clears cookie
    res.json({ message: 'Logout successful' });
  });
});


// GET dogs
router.get('/ownedDogs', async (req, res) => {
  const ownerId = req.session.user.user_id;

  try {
    const [dogs] = await db.query(`
      SELECT dog_id, name FROM Dogs WHERE owner_id = ?
      `, [ownerId]); // safely get dogs owned by owner id
    res.json(dogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: 'Failed to get owned dogs' });
  }
});


// api/dogs route from part 1
router.get('/dogs', async (req, res) => {
  try {
    const [dogs] = await db.execute(`
      SELECT d.dog_id, d.name AS dog_name, d.size, u.user_id AS owner_id
      FROM Dogs d JOIN Users u ON d.owner_id = u.user_id
      `);
      res.json(dogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve dogs' });
  }
});

module.exports = router;