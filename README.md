# SecureBank - Full-Stack Banking Application

A comprehensive banking application with real-time cross-device functionality, built with Node.js, React, TypeScript, and Socket.IO.

## 🚀 Features

### Core Functionality
- **User Dashboard**: View balance, create transactions, track transaction history
- **Admin Dashboard**: Approve/decline transactions, manage users, freeze accounts
- **Real-Time Updates**: Cross-device synchronization using WebSocket connections
- **Secure Authentication**: JWT-based authentication with role-based access control

### Key Highlights
- ✅ **Cross-Device Compatibility**: Admin can approve transactions from any device
- ✅ **Real-Time Notifications**: Instant updates without page refresh
- ✅ **Transaction Management**: Complete workflow from creation to approval
- ✅ **User Management**: Admin can freeze/unfreeze user accounts
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile
- ✅ **No Local Storage Dependency**: True cross-device functionality

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose ODM
- Socket.IO for real-time communication
- JWT for authentication
- bcryptjs for password hashing
- CORS for cross-origin requests

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Socket.IO Client for real-time updates
- Styled Components for styling
- Axios for HTTP requests
- React Hot Toast for notifications

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with your configuration
cp .env.example .env

# Start the development server
npm run dev
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file with your configuration
cp .env.example .env

# Start the development server
npm start
```

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/banking-app
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 🔧 Usage

### Demo Accounts
The application comes with demo accounts for testing:

**Admin Account:**
- Email: `admin@demo.com`
- Password: `password`

**User Account:**
- Email: `user@demo.com`
- Password: `password`

### User Workflow
1. **Login/Register**: Create an account or use demo credentials
2. **View Dashboard**: See account balance and transaction history
3. **Create Transaction**: Submit deposit, withdrawal, or transfer requests
4. **Track Status**: Monitor transaction approval status in real-time

### Admin Workflow
1. **Login**: Use admin credentials to access admin dashboard
2. **Review Transactions**: View all pending transactions from users
3. **Approve/Decline**: Process transactions with optional comments
4. **Manage Users**: Freeze/unfreeze user accounts as needed
5. **Monitor Activity**: Track system-wide statistics and activity

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Transactions (User)
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create new transaction
- `DELETE /api/transactions/:id` - Cancel pending transaction

### Admin
- `GET /api/admin/transactions/pending` - Get pending transactions
- `PATCH /api/admin/transactions/:id` - Approve/decline transaction
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id/freeze` - Freeze/unfreeze user account
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

## 🔄 Real-Time Events

### Socket.IO Events
- `newTransaction` - New transaction created by user
- `transactionUpdate` - Transaction approved/declined by admin
- `accountStatusChange` - User account frozen/unfrozen
- `transactionCancelled` - User cancelled pending transaction

## 🚀 Deployment

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables in Render dashboard
4. Deploy with build command: `npm install`
5. Start command: `npm start`

### Frontend (Vercel)
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend directory
3. Run: `vercel`
4. Set environment variables in Vercel dashboard
5. Deploy: `vercel --prod`

### Production Environment Variables

#### Backend (Render)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/banking-app
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://your-vercel-app.vercel.app
```

#### Frontend (Vercel)
```env
REACT_APP_API_URL=https://your-render-app.onrender.com/api
REACT_APP_SOCKET_URL=https://your-render-app.onrender.com
```

## 🧪 Testing

### Manual Testing Scenarios
1. **Cross-Device Testing**: 
   - Login as user on one device
   - Login as admin on another device
   - Create transaction on user device
   - Approve on admin device
   - Verify real-time updates on user device

2. **Account Management**:
   - Freeze user account from admin dashboard
   - Verify user cannot create transactions
   - Unfreeze and verify functionality restored

3. **Real-Time Features**:
   - Multiple admin sessions
   - Transaction notifications
   - Balance updates
   - Account status changes

## 📱 Cross-Device Functionality

The application is specifically designed for cross-device usage:

- **No Local Storage Dependency**: All state managed server-side
- **WebSocket Connections**: Real-time updates across all connected devices
- **JWT Authentication**: Secure token-based auth works across devices
- **Database-Driven**: All data stored in MongoDB for universal access

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS protection
- Protected API routes
- Secure WebSocket connections

## 📂 Project Structure

```
banking-app/
├── backend/
│   ├── models/           # MongoDB schemas
│   ├── routes/           # Express route handlers
│   ├── middleware/       # Authentication middleware
│   └── server.js         # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── contexts/     # React context providers
│   │   ├── pages/        # Page components
│   │   └── services/     # API and Socket services
│   └── public/           # Static assets
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (especially cross-device functionality)
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🐛 Known Issues

- None at this time

## 📞 Support

For questions or issues, please open a GitHub issue or contact the development team.

---

**Note**: This application demonstrates enterprise-level banking functionality with real-time cross-device capabilities. It's built with production-ready practices and can be deployed to handle real-world usage scenarios.
