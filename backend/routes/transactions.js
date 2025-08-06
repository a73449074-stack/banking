const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { authenticateToken, requireUser } = require('../middleware/auth');

const router = express.Router();

// Get user transactions
router.get('/', authenticateToken, requireUser, async (req, res) => {
  console.log('🔥🔥🔥 TRANSACTION API CALLED 🔥🔥🔥');
  console.log('User ID:', req.user._id);
  console.log('Headers:', req.headers.authorization ? 'Token present' : 'No token');
  
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { userId: req.user._id };
    
    console.log('Getting transactions for user:', req.user._id);
    console.log('Filter:', filter);
    
    if (status) {
      filter.status = status;
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('adminAction.adminId', 'username');

    const total = await Transaction.countDocuments(filter);
    
    console.log('Found transactions:', transactions.length);
    console.log('Total transactions:', total);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new transaction
router.post('/', authenticateToken, requireUser, async (req, res) => {
  try {
    const { type, amount, description, recipient } = req.body;

    // Validation
    if (!type || !amount) {
      return res.status(400).json({ error: 'Transaction type and amount are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (req.user.isFrozen) {
      return res.status(403).json({ error: 'Account is frozen. Cannot perform transactions.' });
    }

    // Check if user has sufficient balance for withdrawals and transfers
    if (type === 'withdrawal' || type === 'transfer') {
      if (req.user.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
    }

    // Validate recipient for transfers
    if (type === 'transfer') {
      if (!recipient || !recipient.accountNumber || !recipient.name) {
        return res.status(400).json({ error: 'Recipient details are required for transfers' });
      }

      // Check if transferring to own account (only for internal accounts)
      const recipientUser = await User.findOne({ 
        accountNumber: recipient.accountNumber 
      });
      
      if (recipientUser && recipientUser._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ error: 'Cannot transfer to your own account' });
      }
    }

    // Create transaction
    const transaction = new Transaction({
      transactionId: Transaction.generateTransactionId(),
      userId: req.user._id,
      type,
      amount,
      description,
      recipient: type === 'transfer' ? recipient : undefined,
      status: 'pending'
    });

    await transaction.save();
    await transaction.populate('userId', 'username accountNumber');

    // Emit real-time notification to admins
    req.io.to('admins').emit('newTransaction', {
      transaction: {
        ...transaction.toObject(),
        user: {
          username: req.user.username,
          accountNumber: req.user.accountNumber
        }
      }
    });

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single transaction
router.get('/:id', authenticateToken, requireUser, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('adminAction.adminId', 'username');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel pending transaction
router.delete('/:id', authenticateToken, requireUser, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'pending'
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Pending transaction not found' });
    }

    await Transaction.findByIdAndDelete(req.params.id);

    // Notify admins about cancellation
    req.io.to('admins').emit('transactionCancelled', {
      transactionId: transaction._id,
      userId: req.user._id
    });

    res.json({ message: 'Transaction cancelled successfully' });

  } catch (error) {
    console.error('Cancel transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
