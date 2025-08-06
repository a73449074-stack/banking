import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { transactionAPI, Transaction } from '../services/api';
import socketService from '../services/socket';
import { LogOut, Plus, RefreshCw } from 'lucide-react';
import {
  DashboardContainer,
  Header,
  Logo,
  UserInfo,
  UserName,
  Balance,
  Button,
  MainContent,
  Grid,
  StatsCard,
  StatsTitle,
  StatsValue,
  TransactionCard,
  TransactionHeader,
  TransactionTitle,
  TransactionList,
  TransactionItem,
  TransactionInfo,
  TransactionType,
  TransactionAmount,
  Status,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  CloseButton,
  Form,
  Input,
  Select,
  ErrorMessage,
  LoadingSpinner,
} from '../components/StyledComponents';
import toast from 'react-hot-toast';

interface TransactionFormData {
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: string;
  description: string;
  recipientAccount: string;
  recipientName: string;
}

const UserDashboard: React.FC = () => {
  console.log('🎯🎯🎯 UserDashboard component is RENDERING 🎯🎯🎯');
  console.log('UserDashboard component rendering');
  const { user, logout, updateBalance } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'deposit',
    amount: '',
    description: '',
    recipientAccount: '',
    recipientName: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.log('🔥🔥🔥 UserDashboard useEffect TRIGGERED 🔥🔥🔥');
    console.log('UserDashboard useEffect triggered');
    
    // Debug authentication state
    console.log('🔐 AUTH DEBUG: Current user:', user);
    console.log('🔐 AUTH DEBUG: Token in localStorage:', localStorage.getItem('authToken'));
    console.log('🔐 AUTH DEBUG: User object in localStorage:', localStorage.getItem('user'));
    
    // Decode JWT token to see what user it belongs to
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const tokenData = JSON.parse(jsonPayload);
        console.log('🔐 JWT TOKEN DECODED:', tokenData);
        console.log('🔐 TOKEN BELONGS TO USER ID:', tokenData.userId);
        console.log('🔐 CURRENT USER ID IN CONTEXT:', user?._id);
      } catch (e) {
        console.error('🔐 Failed to decode JWT token:', e);
      }
    }
    
    // Force immediate execution
    const forceLoad = async () => {
      console.log('🚀 FORCING TRANSACTION LOAD 🚀');
      try {
        setLoading(true);
        console.log('Making API call to /api/transactions...');
        const response = await transactionAPI.getTransactions({ limit: 50 });
        console.log('🚀 FORCED RESPONSE:', response);
        
        // Handle both response formats
        const transactionData = response.transactions || response;
        setTransactions(Array.isArray(transactionData) ? transactionData : []);
        console.log('✅ Transactions set to state:', transactionData);
        
      } catch (error) {
        console.error('🚀 FORCED ERROR:', error);
        console.error('🚀 ERROR RESPONSE:', (error as any).response?.data);
        console.error('🚀 ERROR STATUS:', (error as any).response?.status);
        // If API fails, show some demo data for testing
        setTransactions([
          {
            _id: 'demo1',
            transactionId: 'TXN001',
            userId: 'user123',
            type: 'deposit',
            amount: 500,
            description: 'Demo deposit',
            status: 'approved',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    forceLoad();
    setupRealtimeListeners();
  }, []);

  const setupRealtimeListeners = () => {
    // Listen for new transactions from admin
    socketService.on('transactionUpdate', (data: any) => {
      loadTransactions(); // Refresh transactions
      if (data.userBalance !== undefined) {
        updateBalance(data.userBalance);
      }
    });

    // Listen for account status changes
    socketService.on('accountStatusChange', (data: any) => {
      toast(data.message);
    });
  };

  const loadTransactions = async () => {
    console.log('📊📊📊 loadTransactions function called 📊📊📊');
    console.log('📊 Current user:', user);
    console.log('📊 Current loading state:', loading);
    console.log('📊 Token in localStorage:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
    
    try {
      console.log('📊 Starting transaction load...');
      const response = await transactionAPI.getTransactions({ limit: 10 });
      console.log('📊 Transactions response received:', response);
      setTransactions(response.transactions);
      console.log('📊 Transactions set to state:', response.transactions);
    } catch (error: any) {
      console.error('📊 Transaction loading error:', error);
      console.error('📊 Error details:', error.response?.data);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
      console.log('📊 Loading set to false');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const amount = parseFloat(formData.amount);
      
      if (isNaN(amount) || amount <= 0) {
        setFormError('Please enter a valid amount');
        return;
      }

      if (user?.isFrozen) {
        setFormError('Your account is frozen. Please contact support.');
        return;
      }

      const transactionData: any = {
        type: formData.type,
        amount,
        description: formData.description || undefined,
      };

      if (formData.type === 'transfer') {
        if (!formData.recipientAccount || !formData.recipientName) {
          setFormError('Recipient details are required for transfers');
          return;
        }
        transactionData.recipient = {
          accountNumber: formData.recipientAccount,
          name: formData.recipientName,
        };
      }

      await transactionAPI.createTransaction(transactionData);
      toast.success('Transaction submitted successfully! Waiting for admin approval.');
      
      // Reset form and close modal
      setFormData({
        type: 'deposit',
        amount: '',
        description: '',
        recipientAccount: '',
        recipientName: '',
      });
      setShowModal(false);
      
      // Reload transactions
      loadTransactions();
    } catch (error: any) {
      setFormError(error.response?.data?.error || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForceRelogin = () => {
    console.log('🔄 FORCING RE-LOGIN - Clearing all auth data');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    logout();
    window.location.href = '/login';
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'deposit' ? '+' : '-';
    return `${sign}$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const completedTransactions = transactions.filter(t => t.status !== 'pending');

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingSpinner />
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Logo>SecureBank</Logo>
        <UserInfo>
          <UserName>Welcome, {user?.username}</UserName>
          <Balance>Balance: ${user?.balance?.toFixed(2) || '0.00'}</Balance>
          <Button variant="secondary" onClick={logout}>
            <LogOut size={16} style={{ marginRight: '8px' }} />
            Logout
          </Button>
        </UserInfo>
      </Header>

      <MainContent>
        <Grid columns={3}>
          <StatsCard>
            <StatsTitle>Account Number</StatsTitle>
            <StatsValue style={{ fontSize: '18px' }}>{user?.accountNumber}</StatsValue>
          </StatsCard>
          <StatsCard>
            <StatsTitle>Pending Transactions</StatsTitle>
            <StatsValue>{pendingTransactions.length}</StatsValue>
          </StatsCard>
          <StatsCard>
            <StatsTitle>Total Transactions</StatsTitle>
            <StatsValue>{transactions.length}</StatsValue>
          </StatsCard>
        </Grid>

        <TransactionCard>
          <TransactionHeader>
            <TransactionTitle>Recent Transactions</TransactionTitle>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button onClick={() => loadTransactions()}>
                <RefreshCw size={16} style={{ marginRight: '8px' }} />
                Refresh
              </Button>
              <Button variant="secondary" onClick={handleForceRelogin}>
                🔄 Force Re-login
              </Button>
              <Button onClick={() => setShowModal(true)}>
                <Plus size={16} style={{ marginRight: '8px' }} />
                New Transaction
              </Button>
            </div>
          </TransactionHeader>

          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              No transactions yet. Create your first transaction!
            </div>
          ) : (
            <TransactionList>
              {transactions.map((transaction) => (
                <TransactionItem key={transaction._id} status={transaction.status}>
                  <TransactionInfo>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <TransactionType>{transaction.type}</TransactionType>
                      <Status status={transaction.status}>{transaction.status}</Status>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {formatDate(transaction.createdAt)}
                    </div>
                    {transaction.description && (
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {transaction.description}
                      </div>
                    )}
                    {transaction.recipient && (
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        To: {transaction.recipient.name} ({transaction.recipient.accountNumber})
                      </div>
                    )}
                  </TransactionInfo>
                  <TransactionAmount type={transaction.type}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </TransactionAmount>
                </TransactionItem>
              ))}
            </TransactionList>
          )}
        </TransactionCard>
      </MainContent>

      <Modal isOpen={showModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>New Transaction</ModalTitle>
            <CloseButton onClick={() => setShowModal(false)}>×</CloseButton>
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <Select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
            </Select>
            <Input
              type="number"
              name="amount"
              placeholder="Amount"
              value={formData.amount}
              onChange={handleInputChange}
              step="0.01"
              min="0.01"
              required
            />
            <Input
              type="text"
              name="description"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={handleInputChange}
            />
            {formData.type === 'transfer' && (
              <>
                <Input
                  type="text"
                  name="recipientAccount"
                  placeholder="Recipient Account Number"
                  value={formData.recipientAccount}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  type="text"
                  name="recipientName"
                  placeholder="Recipient Name"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  required
                />
              </>
            )}
            {formError && <ErrorMessage>{formError}</ErrorMessage>}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Transaction'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </Form>
        </ModalContent>
      </Modal>
    </DashboardContainer>
  );
};

export default UserDashboard;
