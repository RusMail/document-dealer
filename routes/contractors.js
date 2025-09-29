const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all contractors
router.get('/', authenticateToken, async (req, res) => {
  try {
    const contractors = await prisma.contractor.findMany({
      select: {
        id: true,
        shortName: true,
        fullName: true,
        inn: true,
        kpp: true,
        ogrn: true,
        okpo: true,
        okved: true,
        legalAddress: true,
        actualAddress: true,
        checkingAccount: true,
        bankName: true,
        correspondentAccount: true,
        bik: true,
        director: true,
        phone: true,
        email: true,
        createdAt: true,
        creator: {
          select: { name: true }
        }
      }
    });
    res.json({ contractors });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get contractor by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const contractor = await prisma.contractor.findUnique({
      where: { id },
      select: {
        id: true,
        shortName: true,
        fullName: true,
        inn: true,
        kpp: true,
        ogrn: true,
        okpo: true,
        okved: true,
        legalAddress: true,
        actualAddress: true,
        checkingAccount: true,
        bankName: true,
        correspondentAccount: true,
        bik: true,
        director: true,
        phone: true,
        email: true,
        createdAt: true,
        creator: {
          select: { name: true }
        }
      }
    });

    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    res.json({ contractor });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new contractor
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      shortName, fullName, ogrn, inn, kpp, okpo, okved,
      legalAddress, actualAddress, checkingAccount, bankName,
      correspondentAccount, bik, director, phone, email
    } = req.body;

    if (!shortName || !fullName || !ogrn || !inn || !legalAddress) {
      return res.status(400).json({ error: 'Short name, full name, OGRN, INN, and legal address are required' });
    }

    const contractor = await prisma.contractor.create({
      data: {
        shortName,
        fullName,
        ogrn,
        inn,
        kpp,
        okpo,
        okved,
        legalAddress,
        actualAddress,
        checkingAccount,
        bankName,
        correspondentAccount,
        bik,
        director,
        phone,
        email,
        createdBy: req.user.id
      },
      select: {
        id: true,
        shortName: true,
        fullName: true,
        inn: true,
        kpp: true,
        ogrn: true,
        okpo: true,
        okved: true,
        legalAddress: true,
        actualAddress: true,
        checkingAccount: true,
        bankName: true,
        correspondentAccount: true,
        bik: true,
        director: true,
        phone: true,
        email: true,
        createdAt: true,
        creator: {
          select: { name: true }
        }
      }
    });

    res.status(201).json({ contractor });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Contractor with this INN already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update contractor (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      shortName, fullName, ogrn, inn, kpp, okpo, okved,
      legalAddress, actualAddress, checkingAccount, bankName,
      correspondentAccount, bik, director, phone, email
    } = req.body;

    const contractor = await prisma.contractor.update({
      where: { id },
      data: {
        shortName,
        fullName,
        ogrn,
        inn,
        kpp,
        okpo,
        okved,
        legalAddress,
        actualAddress,
        checkingAccount,
        bankName,
        correspondentAccount,
        bik,
        director,
        phone,
        email
      },
      select: {
        id: true,
        shortName: true,
        fullName: true,
        inn: true,
        kpp: true,
        ogrn: true,
        okpo: true,
        okved: true,
        legalAddress: true,
        actualAddress: true,
        checkingAccount: true,
        bankName: true,
        correspondentAccount: true,
        bik: true,
        director: true,
        phone: true,
        email: true,
        createdAt: true,
        creator: {
          select: { name: true }
        }
      }
    });

    res.json({ contractor });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Contractor not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Contractor with this INN already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete contractor
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.contractor.delete({
      where: { id }
    });

    res.json({ message: 'Contractor deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Contractor not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
