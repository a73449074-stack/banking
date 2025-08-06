import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, Transaction, User } from '../services/api';
import socketService from '../services/socket';
import { LogOut, Check, X, RefreshCw, Users, Snowflake, Play } from 'lucide-react';
import {
  DashboardContainer,
  Header,
  Logo,
  UserInfo,
  UserName,
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
  LoadingSpinner,
} from '../components/StyledComponents';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalUsers: number;
  pendingTransactions: number;
  totalTransactions: number;
  frozenAccounts: number;
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingTransactions: 0,
    totalTransactions: 0,
    frozenAccounts: 0,
  });
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'users'>('transactions');
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    setupRealtimeListeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupRealtimeListeners = () => {
    // Listen for new transactions
    socketService.on('newTransaction', (data: any) => {
      toast(`New ${data.transaction.type} transaction from ${data.transaction.user.username}`);
      loadDashboardData(); // Refresh data
    });

    // Listen for transaction cancellations
    socketService.on('transactionCancelled', (data: any) => {
      toast('A transaction was cancelled by the user');
      loadDashboardData();
    });
  };

  const loadDashboardData = async () => {
    try {
      const [statsResponse, transactionsResponse, usersResponse] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getPendingTransactions({ limit: 20 }),
        adminAPI.getUsers({ limit: 20 }),
      ]);

      setStats(statsResponse);
      setPendingTransactions(transactionsResponse.transactions);
      setUsers(usersResponse.users);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAction = async (action: 'approve' | 'decline') => {
    if (!selectedTransaction) return;

    setProcessing(true);
    try {
      await adminAPI.processTransaction(selectedTransaction._id, {
        action,
        comment: actionComment,
      });

      toast.success(`Transaction ${action}d successfully`);
      setShowModal(false);
      setSelectedTransaction(null);
      setActionComment('');
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${action} transaction`);
    } finally {
      setProcessing(false);
    }
  };

  const handleFreezeUser = async (userId: string, freeze: boolean) => {
    try {
      await adminAPI.freezeUser(userId, freeze);
      toast.success(`User account ${freeze ? 'frozen' : 'unfrozen'} successfully`);
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user status');
    }
  };

  const openTransactionModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setActionComment('');
    setShowModal(true);
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
        <Logo>SecureBank Admin</Logo>
        <UserInfo>
          <UserName>Welcome, {user?.username}</UserName>
          <Button variant="secondary" onClick={logout}>
            <LogOut size={16} style={{ marginRight: '8px' }} />
            Logout
          </Button>
        </UserInfo>
      </Header>

      <MainContent>
        <Grid columns={4}>
          <StatsCard>
            <StatsTitle>Total Users</StatsTitle>
            <StatsValue>{stats.totalUsers}</StatsValue>
          </StatsCard>
          <StatsCard>
            <StatsTitle>Pending Transactions</StatsTitle>
            <StatsValue style={{ color: '#f59e0b' }}>{stats.pendingTransactions}</StatsValue>
          </StatsCard>
          <StatsCard>
            <StatsTitle>Total Transactions</StatsTitle>
            <StatsValue>{stats.totalTransactions}</StatsValue>
          </StatsCard>
          <StatsCard>
            <StatsTitle>Frozen Accounts</StatsTitle>
            <StatsValue style={{ color: '#ef4444' }}>{stats.frozenAccounts}</StatsValue>
          </StatsCard>
        </Grid>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button 
              variant={activeTab === 'transactions' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('transactions')}
            >
              Pending Transactions ({pendingTransactions.length})
            </Button>
            <Button 
              variant={activeTab === 'users' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('users')}
            >
              <Users size={16} style={{ marginRight: '8px' }} />
              Manage Users
            </Button>
            <Button onClick={loadDashboardData}>
              <RefreshCw size={16} style={{ marginRight: '8px' }} />
              Refresh
            </Button>
          </div>
        </div>

        {activeTab === 'transactions' && (
          <TransactionCard>
            <TransactionHeader>
              <TransactionTitle>Pending Transactions</TransactionTitle>
            </TransactionHeader>

            {pendingTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                No pending transactions
              </div>
            ) : (
              <TransactionList>
                {pendingTransactions.map((transaction) => (
                  <TransactionItem key={transaction._id} status={transaction.status}>
                    <TransactionInfo>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <TransactionType>{transaction.type}</TransactionType>
                        <Status status={transaction.status}>{transaction.status}</Status>
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        User: {(transaction as any).userId?.username} ({(transaction as any).userId?.accountNumber})
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <TransactionAmount type={transaction.type}>
                        {formatAmount(transaction.amount, transaction.type)}
                      </TransactionAmount>
                      <Button 
                        onClick={() => openTransactionModal(transaction)}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        Review
                      </Button>
                    </div>
                  </TransactionItem>
                ))}
              </TransactionList>
            )}
          </TransactionCard>
        )}

        {activeTab === 'users' && (
          <TransactionCard>
            <TransactionHeader>
              <TransactionTitle>User Management</TransactionTitle>
            </TransactionHeader>

            {users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                No users found
              </div>
            ) : (
              <TransactionList>
                {users.map((user) => (
                  <TransactionItem key={user.id}>
                    <TransactionInfo>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <strong>{user.username}</strong>
                        {user.isFrozen && <Status status="declined">Frozen</Status>}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Email: {user.email}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Account: {user.accountNumber}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Balance: ${user.balance?.toFixed(2) || '0.00'}
                      </div>
                    </TransactionInfo>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Button
                        variant={user.isFrozen ? 'primary' : 'danger'}
                        onClick={() => handleFreezeUser(user._id, !user.isFrozen)}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        {user.isFrozen ? (
                          <>
                            <Play size={12} style={{ marginRight: '4px' }} />
                            Unfreeze
                          </>
                        ) : (
                          <>
                            <Snowflake size={12} style={{ marginRight: '4px' }} />
                            Freeze
                          </>
                        )}
                      </Button>
                    </div>
                  </TransactionItem>
                ))}
              </TransactionList>
            )}
          </TransactionCard>
        )}
      </MainContent>

      <Modal isOpen={showModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Review Transaction</ModalTitle>
            <CloseButton onClick={() => setShowModal(false)}>×</CloseButton>
          </ModalHeader>
          
          {selectedTransaction && (
            <div>
              <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                <div><strong>Type:</strong> {selectedTransaction.type}</div>
                <div><strong>Amount:</strong> ${selectedTransaction.amount.toFixed(2)}</div>
                <div><strong>User:</strong> {(selectedTransaction as any).userId?.username}</div>
                <div><strong>Date:</strong> {formatDate(selectedTransaction.createdAt)}</div>
                {selectedTransaction.description && (
                  <div><strong>Description:</strong> {selectedTransaction.description}</div>
                )}
                {selectedTransaction.recipient && (
                  <div>
                    <strong>Recipient:</strong> {selectedTransaction.recipient.name} 
                    ({selectedTransaction.recipient.accountNumber})
                  </div>
                )}
              </div>

              <Form onSubmit={(e) => e.preventDefault()}>
                <Input
                  type="text"
                  placeholder="Add a comment (optional)"
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                />
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <Button
                    onClick={() => handleTransactionAction('approve')}
                    disabled={processing}
                    style={{ flex: 1 }}
                  >
                    <Check size={16} style={{ marginRight: '8px' }} />
                    {processing ? 'Processing...' : 'Approve'}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleTransactionAction('decline')}
                    disabled={processing}
                    style={{ flex: 1 }}
                  >
                    <X size={16} style={{ marginRight: '8px' }} />
                    {processing ? 'Processing...' : 'Decline'}
                  </Button>
                </div>
              </Form>
            </div>
          )}
        </ModalContent>
      </Modal>
    </DashboardContainer>
  );
};

export default AdminDashboard;
