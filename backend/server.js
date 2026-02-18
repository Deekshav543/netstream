const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database table on server startup
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    connection.release();
    console.log('Database table initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// POST /register
app.post('/register', async (req, res) => {
  let connection;
  try {
    const { username, password, email, phone } = req.body;

    // Validation
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

    connection = await pool.getConnection();

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [username.trim()]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    // Hash password using bcrypt with proper error handling
    const saltRounds = 10;
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } catch (hashError) {
      console.error('Password hashing error:', hashError);
      connection.release();
      return res.status(500).json({ 
        success: false, 
        message: 'Error processing password' 
      });
    }

    // Insert user into database
    try {
      await connection.execute(
        'INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)',
        [
          username.trim(), 
          hashedPassword, 
          email ? email.trim() : null, 
          phone ? phone.trim() : null
        ]
      );
      connection.release();
      
      console.log(`User registered successfully: ${username}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Registration successful' 
      });
    } catch (insertError) {
      connection.release();
      console.error('Database insert error:', insertError);
      
      // Check for duplicate username error
      if (insertError.code === 'ER_DUP_ENTRY') {
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
    if (connection) {
      connection.release();
    }
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.' 
    });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  let connection;
  try {
    const { username, password } = req.body;

    // Validation
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

    connection = await pool.getConnection();

    // Fetch user from database
    const [users] = await connection.execute(
      'SELECT id, username, password FROM users WHERE username = ?',
      [username.trim()]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(200).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    const user = users[0];

    // Verify password hash exists
    if (!user.password || user.password.length === 0) {
      console.error('User found but password hash is missing');
      return res.status(200).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Compare entered password with stored hashed password using bcrypt.compare()
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
    if (connection) {
      connection.release();
    }
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeDatabase();
});
