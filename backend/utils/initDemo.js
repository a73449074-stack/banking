const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
require('dotenv').config();

const initializeDemo = async () => {
  try {
    // Check if demo users already exist
    const adminExists = await User.findOne({ email: 'admin@demo.com' });
    const userExists = await User.findOne({ email: 'user@demo.com' });

    let admin, user;

    if (!adminExists) {
      const adminAccount = User.generateAccountNumber();
      admin = new User({
        username: 'admin',
        email: 'admin@demo.com',
        password: 'password',
        role: 'admin',
        accountNumber: adminAccount,
        balance: 0
      });
      await admin.save();
      console.log('Demo admin account created');
    } else {
      admin = adminExists;
    }

    if (!userExists) {
      const userAccount = User.generateAccountNumber();
      user = new User({
        username: 'demouser',
        email: 'user@demo.com',
        password: 'password',
        role: 'user',
        accountNumber: userAccount,
        balance: 1000
      });
      await user.save();
      console.log('Demo user account created');
    } else {
      user = userExists;
    }

    // Create some demo transactions if they don't exist
    const existingTransactions = await Transaction.countDocuments({ userId: user._id });
    console.log(`Found ${existingTransactions} existing transactions for user`);
    
    if (existingTransactions < 4) { // Only create if we have less than 4 transactions
      const demoTransactions = [
        {
          transactionId: Transaction.generateTransactionId(),
          userId: user._id,
          type: 'deposit',
          amount: 500,
          description: 'Initial deposit',
          status: 'approved',
          balanceAfter: 1500,
          adminAction: {
            adminId: admin._id,
            actionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            comment: 'Welcome bonus'
          }
        },
        {
          transactionId: Transaction.generateTransactionId(),
          userId: user._id,
          type: 'transfer',
          amount: 200,
          description: 'Transfer to friend',
          recipient: {
            accountNumber: '9876543210',
            name: 'John Doe'
          },
          status: 'approved',
          balanceAfter: 1300,
          adminAction: {
            adminId: admin._id,
            actionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            comment: 'Verified transfer'
          }
        },
        {
          transactionId: Transaction.generateTransactionId(),
          userId: user._id,
          type: 'withdrawal',
          amount: 100,
          description: 'ATM withdrawal',
          status: 'approved',
          balanceAfter: 1200,
          adminAction: {
            adminId: admin._id,
            actionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            comment: 'ATM withdrawal approved'
          }
        },
        {
          transactionId: Transaction.generateTransactionId(),
          userId: user._id,
          type: 'deposit',
          amount: 300,
          description: 'Salary deposit',
          status: 'pending'
        }
      ];

      for (const transactionData of demoTransactions) {
        const transaction = new Transaction(transactionData);
        await transaction.save();
        console.log(`Created transaction: ${transaction.type} - ${transaction.amount}`);
      }
      
      console.log('Demo transactions created');
    } else {
      console.log(`Demo transactions already exist (${existingTransactions} found), skipping creation`);
    }

    console.log('Demo initialization complete');
  } catch (error) {
    console.error('Demo initialization error:', error);
  }
};

module.exports = initializeDemo;
