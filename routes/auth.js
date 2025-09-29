const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin, requireUser } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Register new user (admin only)
router.post('/register', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, name, password, role } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'USER'
      }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('Searching for user:', email);
    const user = await prisma.user.findUnique({
      where: { email }
    });

    console.log('User found:', user);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Password check passed');

    try {
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      console.log('Token created successfully');

      res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token
      });
    } catch (tokenError) {
      console.error('Token creation error:', tokenError);
      res.status(500).json({ error: 'Token creation failed' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create admin user (only if no admin exists)
router.post('/create-admin', async (req, res) => {
  try {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    if (adminCount > 0) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }

    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    // Hash password for testing
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Administrator',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: { id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role }
  });
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: req.user.id }
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already taken' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, email },
      select: { id: true, email: true, name: true, role: true }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin only)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: id }
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already taken' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
