const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database table initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

app.post('/register', async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    if (username.trim().length === 0 || password.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Username and password cannot be empty'
      });
    }

    const existingUsers = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username.trim()]
    );

    if (existingUsers.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    const saltRounds = 10;
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } catch (hashError) {
      console.error('Password hashing error:', hashError);
      return res.status(500).json({
        success: false,
        message: 'Error processing password'
      });
    }

    try {
      await pool.query(
        'INSERT INTO users (username, password, email, phone) VALUES ($1, $2, $3, $4)',
        [
          username.trim(),
          hashedPassword,
          email ? email.trim() : null,
          phone ? phone.trim() : null
        ]
      );

      console.log(`User registered successfully: ${username}`);
      return res.status(200).json({
        success: true,
        message: 'Registration successful'
      });
    } catch (insertError) {
      console.error('Database insert error:', insertError);

      if (insertError.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    if (username.trim().length === 0 || password.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Username and password cannot be empty'
      });
    }

    const result = await pool.query(
      'SELECT id, username, password FROM users WHERE username = $1',
      [username.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const user = result.rows[0];

    if (!user.password || user.password.length === 0) {
      console.error('User found but password hash is missing');
      return res.status(200).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (compareError) {
      console.error('Password comparison error:', compareError);
      return res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }

    if (isPasswordValid) {
      console.log(`User logged in successfully: ${username}`);
      return res.status(200).json({
        success: true,
        message: 'Login successful'
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeDatabase();
});
