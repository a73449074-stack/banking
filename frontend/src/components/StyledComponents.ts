import styled from 'styled-components';

export const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

export const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
`;

export const Title = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

export const Select = styled.select`
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  background: white;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => {
    switch (props.variant) {
      case 'secondary':
        return `
          background: #6b7280;
          color: white;
          &:hover {
            background: #4b5563;
          }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover {
            background: #dc2626;
          }
        `;
      default:
        return `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
`;

export const Link = styled.a`
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  text-align: center;
  display: block;
  margin-top: 20px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export const DashboardContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
`;

export const Header = styled.header`
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const Logo = styled.h1`
  color: #667eea;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
`;

export const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const UserName = styled.span`
  font-weight: 600;
  color: #374151;
`;

export const Balance = styled.span`
  background: #10b981;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
`;

export const MainContent = styled.main`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

export const Grid = styled.div<{ columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns || 2}, 1fr);
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const StatsCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

export const StatsTitle = styled.h3`
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const StatsValue = styled.div`
  color: #111827;
  font-size: 32px;
  font-weight: 700;
`;

export const TransactionCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

export const TransactionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

export const TransactionTitle = styled.h2`
  color: #111827;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

export const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const TransactionItem = styled.div<{ status?: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f9fafb;
  }

  ${props => {
    if (props.status === 'pending') {
      return 'border-left: 4px solid #f59e0b;';
    } else if (props.status === 'approved') {
      return 'border-left: 4px solid #10b981;';
    } else if (props.status === 'declined') {
      return 'border-left: 4px solid #ef4444;';
    }
    return '';
  }}
`;

export const TransactionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const TransactionType = styled.span`
  font-weight: 600;
  color: #111827;
  text-transform: capitalize;
`;

export const TransactionAmount = styled.span<{ type?: string }>`
  font-weight: 600;
  color: ${props => {
    if (props.type === 'deposit') return '#10b981';
    if (props.type === 'withdrawal' || props.type === 'transfer') return '#ef4444';
    return '#6b7280';
  }};
`;

export const Status = styled.span<{ status?: string }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => {
    switch (props.status) {
      case 'pending':
        return 'background: #fef3c7; color: #92400e;';
      case 'approved':
        return 'background: #d1fae5; color: #065f46;';
      case 'declined':
        return 'background: #fee2e2; color: #991b1b;';
      default:
        return 'background: #e5e7eb; color: #374151;';
    }
  }}
`;

export const Modal = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

export const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

export const ModalTitle = styled.h2`
  color: #111827;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  
  &:hover {
    background: #f3f4f6;
  }
`;

export const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 14px;
  margin-top: 8px;
  padding: 8px;
  background: #fee2e2;
  border-radius: 4px;
  border: 1px solid #fecaca;
`;

export const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-left: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 20px auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
