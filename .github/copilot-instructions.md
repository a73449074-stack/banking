<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# SecureBank - Full-Stack Banking Application

This is a comprehensive banking application with real-time cross-device functionality built with:

## Backend Stack
- **Node.js & Express**: RESTful API server
- **MongoDB & Mongoose**: Database and ODM
- **Socket.IO**: Real-time WebSocket communication
- **JWT**: Authentication and authorization
- **bcryptjs**: Password hashing

## Frontend Stack
- **React 18 & TypeScript**: Modern UI framework
- **React Router**: Client-side routing
- **Socket.IO Client**: Real-time updates
- **Styled Components**: CSS-in-JS styling
- **Axios**: HTTP client for API calls
- **React Hot Toast**: Notifications

## Key Features
1. **Cross-Device Functionality**: Admin and user dashboards work independently across devices
2. **Real-Time Updates**: WebSocket connections for instant transaction updates
3. **User Authentication**: Secure JWT-based auth system
4. **Transaction Management**: Complete CRUD operations with approval workflow
5. **Admin Controls**: User management, account freezing, transaction approval/decline
6. **Responsive Design**: Works on desktop, tablet, and mobile devices

## Project Structure
- `/backend`: Node.js API server with Socket.IO
- `/frontend`: React TypeScript application
- Real-time communication between admin and user dashboards
- No localStorage dependency for cross-device functionality

## Deployment
- **Backend**: Designed for Render deployment
- **Frontend**: Designed for Vercel deployment
- Environment variables configured for both development and production

## Security Features
- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS configuration
- Protected routes and middleware

## Real-Time Features
- Instant transaction status updates
- Cross-device admin notifications
- Account status changes (freeze/unfreeze)
- Live dashboard statistics

When working on this project, focus on maintaining the real-time functionality and ensuring cross-device compatibility.
