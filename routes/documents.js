const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();
const prisma = new PrismaClient();

// Функция для преобразования полного ФИО в формат "И.О. Фамилия"
function formatDirectorName(fullName) {
  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    return 'Не указан';
  }

  const trimmedName = fullName.trim();

  // Если это уже "Не указан" или другие не-ФИО значения
  if (trimmedName.toLowerCase() === 'не указан' || trimmedName === '—' || trimmedName === '-') {
    return 'Не указан';
  }

  const parts = trimmedName.split(/\s+/);

  if (parts.length < 2) {
    return trimmedName; // Если только имя или только фамилия
  }

  const lastName = parts[0]; // Фамилия
  const firstName = parts[1]; // Имя
  const middleName = parts[2]; // Отчество (может отсутствовать)

  // Проверяем, что имя и фамилия содержат только буквы
  if (!/^[а-яёa-z]+$/i.test(firstName) || !/^[а-яёa-z]+$/i.test(lastName)) {
    return trimmedName; // Возвращаем оригинал, если не похожи на ФИО
  }

  // Берем первую букву имени
  const firstNameInitial = firstName.charAt(0).toUpperCase();

  // Если есть отчество, берем первую букву
  const middleNameInitial = middleName ? middleName.charAt(0).toUpperCase() : '';

  return middleNameInitial
    ? `${firstNameInitial}.${middleNameInitial}. ${lastName}`
    : `${firstNameInitial}. ${lastName}`;
}

// Функция для расчета срока договора (дата договора + 330 дней)
function calculateContractEndDate(startDate) {
  if (!startDate) {
    return 'Не указана';
  }

  try {
    const date = new Date(startDate);
    if (isNaN(date.getTime())) {
      return 'Неверная дата';
    }

    // Добавляем 330 дней
    const endDate = new Date(date.getTime() + (330 * 24 * 60 * 60 * 1000));

    // Форматируем как DD.MM.YYYYг.
    const day = String(endDate.getDate()).padStart(2, '0');
    const month = String(endDate.getMonth() + 1).padStart(2, '0');
    const year = endDate.getFullYear();

    return `${day}.${month}.${year}г.`;
  } catch (error) {
    console.error('Ошибка расчета срока договора:', error);
    return 'Ошибка расчета';
  }
}

// Get all documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      include: {
        contractor: {
          select: {
            id: true,
            shortName: true,
            fullName: true,
            inn: true,
            kpp: true,
            ogrn: true,
            legalAddress: true,
            director: true
          }
        },
        customer: {
          select: {
            id: true,
            shortName: true,
            fullName: true,
            inn: true,
            kpp: true,
            ogrn: true,
            legalAddress: true,
            director: true
          }
        },
        creator: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc' // Новые документы в начале списка
      }
    });
    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get document by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        contractor: {
          select: {
            id: true,
            shortName: true,
            fullName: true,
            inn: true,
            kpp: true,
            ogrn: true,
            legalAddress: true,
            phone: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            shortName: true,
            fullName: true,
            inn: true,
            kpp: true,
            ogrn: true,
            legalAddress: true,
            phone: true,
            email: true
          }
        },
        creator: {
          select: { name: true }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new document
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, customerId, contractorId, amount, date } = req.body;

    if (!type || !customerId || !contractorId || !amount || !date) {
      return res.status(400).json({ error: 'Type, customer ID, contractor ID, amount, and date are required' });
    }

    // Check customer
    const customer = await prisma.contractor.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check contractor
    const contractor = await prisma.contractor.findUnique({
      where: { id: contractorId }
    });

    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    const document = await prisma.document.create({
      data: {
        type,
        contractorId,
        customerId,
        amount: parseFloat(amount),
        date: new Date(date),
        createdBy: req.user.id
      },
      include: {
        contractor: {
          select: {
            id: true,
            shortName: true,
            fullName: true,
            inn: true,
            kpp: true,
            ogrn: true,
            okpo: true,
            legalAddress: true,
            actualAddress: true,
            checkingAccount: true,
            bankName: true,
            correspondentAccount: true,
            bik: true,
            director: true,
            phone: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            shortName: true,
            fullName: true,
            inn: true,
            kpp: true,
            ogrn: true,
            legalAddress: true,
            actualAddress: true,
            checkingAccount: true,
            bankName: true,
            correspondentAccount: true,
            bik: true,
            director: true,
            phone: true,
            email: true
          }
        },
        creator: {
          select: { name: true }
        }
      }
    });

    // Send webhook to n8n with correct template format
    try {
      const webhookData = {
        documentId: document.id,
        type_doc: document.type === 'SHIPMENT' ? 'Отгрузка' : 'Аренда',
        dogovor_number: document.date.toLocaleDateString('ru-RU'),
        date: document.date.toLocaleDateString('ru-RU'),
        ispolnitel: contractor.fullName || contractor.shortName,
        director_ispolnitel: contractor.director || 'Не указан',
        zakazchik: customer.fullName || customer.shortName,
        director_zakazchik: customer.director || 'Не указан',
        uradress_zakazchik: customer.legalAddress,
        mailadress_zakazchik: customer.actualAddress || customer.legalAddress,
        inn_zakazchik: customer.inn,
        kpp_zakazchik: customer.kpp || '',
        ogrn_zakazchik: customer.ogrn || '',
        rs_zakazchik: customer.checkingAccount || '',
        bank_zakazchik: customer.bankName || '',
        ks_zakazchik: customer.correspondentAccount || '',
        bik_zakazchik: customer.bik || '',
        email_zakazchik: customer.email || '',
        phone_zakazchik: customer.phone || '',
        uradress_ispolnitel: contractor.legalAddress,
        inn_ispolnitel: contractor.inn,
        kpp_ispolnitel: contractor.kpp || '',
        rs_ispolnitel: contractor.checkingAccount || '',
        bank_ispolnitel: contractor.bankName || '',
        bik_ispolnitel: contractor.bik || '',
        ks_ispolnitel: contractor.correspondentAccount || '',
        ogrn_ispolnitel: contractor.ogrn || '',
        okpo_ispolnitel: contractor.okpo || '',
        phone_ispolnitel: contractor.phone || '',
        email_ispolnitel: contractor.email || '',
        colontitul_ispolnitel: formatDirectorName(contractor.director),
        colontitul_zakazchik: formatDirectorName(customer.director),
        name_doc: `${customer.shortName}-${contractor.shortName} ${document.date.toLocaleDateString('ru-RU')}`,
        srok_dogovora: calculateContractEndDate(document.date)
      };

      // TODO: Replace with actual webhook URL
      const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://your-webhook-url.com/webhook';
      await axios.post(WEBHOOK_URL, webhookData);

      // Update document status
      await prisma.document.update({
        where: { id: document.id },
        data: { status: 'PROCESSING' }
      });

      document.status = 'PROCESSING';
    } catch (webhookError) {
      console.error('Webhook error:', webhookError.message);
      // Update document status to failed
      await prisma.document.update({
        where: { id: document.id },
        data: { status: 'FAILED' }
      });
      document.status = 'FAILED';
    }

    res.status(201).json({ document });
  } catch (error) {
    console.error('Document creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get document types
router.get('/meta/types', authenticateToken, (req, res) => {
  const types = [
    { value: 'SHIPMENT', label: 'Отгрузка' },
    { value: 'RENTAL', label: 'Аренда' }
  ];
  res.json({ types });
});

// Handle n8n webhook response
router.post('/webhook/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { documentUrl, status, error } = req.body;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const updateData = {
      status: status === 'success' ? 'COMPLETED' : 'FAILED',
      n8nResponse: JSON.stringify(req.body)
    };

    if (documentUrl) {
      updateData.documentUrl = documentUrl;
      console.log(`Document ${id} completed with URL: ${documentUrl}`);
    }

    await prisma.document.update({
      where: { id },
      data: updateData
    });

    res.json({ message: 'Document status updated successfully' });
  } catch (error) {
    console.error('Webhook response error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download document
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        contractor: {
          select: {
            shortName: true,
            fullName: true,
            inn: true,
            kpp: true,
            ogrn: true,
            legalAddress: true,
            director: true
          }
        },
        customer: {
          select: {
            shortName: true,
            fullName: true,
            inn: true,
            kpp: true,
            ogrn: true,
            legalAddress: true,
            director: true
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Document is not ready for download' });
    }

    if (!document.n8nResponse || !document.n8nResponse.documentUrl) {
      return res.status(400).json({ error: 'Document URL not available' });
    }

    // Redirect to the document URL provided by n8n
    res.redirect(document.n8nResponse.documentUrl);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if user can delete this document (admin or creator)
    // Any user can delete documents they created
    if (document.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.document.delete({
      where: { id }
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
