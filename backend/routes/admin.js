const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all pending transactions
router.get('/transactions/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const transactions = await Transaction.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'username email accountNumber balance');

    const total = await Transaction.countDocuments({ status: 'pending' });

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get pending transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all transactions (for admin overview)
router.get('/transactions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'username email accountNumber balance')
      .populate('adminAction.adminId', 'username');

    const total = await Transaction.countDocuments(filter);

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

// Approve or decline transaction
router.patch('/transactions/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { action, comment } = req.body; // action: 'approve' or 'decline'
    
    if (!action || !['approve', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Valid action (approve/decline) is required' });
    }

    const transaction = await Transaction.findById(req.params.id)
      .populate('userId', 'username email accountNumber balance');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending transactions can be processed' });
    }

    const user = transaction.userId;

    // Check if user account is not frozen
    if (user.isFrozen) {
      return res.status(400).json({ error: 'User account is frozen' });
    }

    if (action === 'approve') {
      // Process the transaction
      let newBalance = user.balance;

      if (transaction.type === 'deposit') {
        newBalance += transaction.amount;
      } else if (transaction.type === 'withdrawal' || transaction.type === 'transfer') {
        if (user.balance < transaction.amount) {
          return res.status(400).json({ error: 'Insufficient balance' });
        }
        newBalance -= transaction.amount;
      }

      // Update user balance
      await User.findByIdAndUpdate(user._id, { balance: newBalance });

      // If it's a transfer, credit the recipient
      if (transaction.type === 'transfer') {
        const recipient = await User.findOne({ 
          accountNumber: transaction.recipient.accountNumber 
        });
        
        if (recipient && !recipient.isFrozen) {
          await User.findByIdAndUpdate(recipient._id, {
            $inc: { balance: transaction.amount }
          });
        }
      }

      transaction.balanceAfter = newBalance;
    }

    // Update transaction
    transaction.status = action === 'approve' ? 'approved' : 'declined';
    transaction.adminAction = {
      adminId: req.user._id,
      actionDate: new Date(),
      comment: comment || ''
    };

    await transaction.save();

    // Get updated user data
    const updatedUser = await User.findById(user._id);

    // Emit real-time update to the specific user
    req.io.to(`user_${user._id}`).emit('transactionUpdate', {
      transaction: transaction.toObject(),
      userBalance: updatedUser.balance,
      action
    });

    // Emit update to all admins
    req.io.to('admins').emit('transactionProcessed', {
      transactionId: transaction._id,
      action,
      adminUsername: req.user.username
    });

    res.json({
      message: `Transaction ${action}d successfully`,
      transaction,
      userBalance: updatedUser.balance
    });

  } catch (error) {
    console.error('Process transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { role: 'user' };
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { accountNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Freeze/Unfreeze user account
router.patch('/users/:id/freeze', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { freeze } = req.body; // boolean
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot freeze admin accounts' });
    }

    user.isFrozen = freeze;
    await user.save();

    // Notify user about account status change
    req.io.to(`user_${user._id}`).emit('accountStatusChange', {
      isFrozen: freeze,
      message: freeze ? 'Your account has been frozen' : 'Your account has been unfrozen'
    });

    res.json({
      message: `User account ${freeze ? 'frozen' : 'unfrozen'} successfully`,
      user: {
        id: user._id,
        username: user.username,
        isFrozen: user.isFrozen
      }
    });

  } catch (error) {
    console.error('Freeze user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      pendingTransactions,
      totalTransactions,
      frozenAccounts,
      recentTransactions
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Transaction.countDocuments({ status: 'pending' }),
      Transaction.countDocuments(),
      User.countDocuments({ role: 'user', isFrozen: true }),
      Transaction.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'username accountNumber')
    ]);

    res.json({
      totalUsers,
      pendingTransactions,
      totalTransactions,
      frozenAccounts,
      recentTransactions
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
