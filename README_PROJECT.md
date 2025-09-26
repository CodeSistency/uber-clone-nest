# 🚗 Uber Clone - Complete Ride-Sharing & Delivery Platform

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
</p>

<p align="center">
  A comprehensive, production-ready ride-sharing and delivery platform built with modern technologies and enterprise-grade security.
</p>

## 🌟 Features

### 🚗 **Ride-Sharing System**
- **Real-time ride booking** with WebSocket live tracking
- **Dynamic pricing** with surge multipliers and geographical pricing
- **Driver matching algorithms** with optimization
- **Ride history** and detailed trip analytics
- **Emergency features** and safety protocols

### 🏪 **Marketplace & Delivery**
- **Multi-store platform** with product catalog management
- **Order processing** with real-time status updates
- **Delivery tracking** with ETA calculations
- **Wallet integration** for seamless payments
- **Promotion system** with discount codes

### 👨‍💼 **Comprehensive Admin Panel**
- **Real-time dashboard** with KPIs and live metrics
- **User & Driver Management** with advanced filtering
- **Ride Monitoring** with intervention capabilities
- **Geographical Management** (Countries, States, Cities, Zones)
- **Dynamic Pricing Configuration** with tier management
- **Advanced Reporting** with export capabilities
- **Feature Flags** for gradual rollouts
- **Secure API Key Management** with encryption
- **Notification Broadcasting** system

### 🔐 **Security & Authentication**
- **JWT-based authentication** with refresh tokens
- **Role-Based Access Control (RBAC)** with granular permissions
- **Admin authentication** with dedicated guards
- **API key encryption** with AES-256-GCM
- **Audit logging** for all critical operations

### 💳 **Payment Integration**
- **Stripe payment processing** with webhooks
- **Wallet system** with transaction history
- **Automatic refunds** and dispute handling
- **Multi-currency support** with exchange rates

### 📡 **Real-time Communication**
- **WebSocket connections** for live updates
- **Push notifications** via Firebase
- **SMS notifications** via Twilio
- **In-app messaging** between users and drivers
- **Emergency alert system**

### 📊 **Analytics & Reporting**
- **Comprehensive dashboards** with charts and metrics
- **Export capabilities** (CSV, PDF, Excel)
- **Scheduled reports** with email delivery
- **Performance monitoring** with health checks
- **Business intelligence** tools

## 🏗️ Architecture

### **Backend Architecture**
```
├── 🗄️ Database Layer (PostgreSQL + Prisma ORM)
├── 🔐 Authentication Layer (JWT + RBAC)
├── 🚀 API Layer (REST + GraphQL support)
├── 📡 Real-time Layer (WebSocket + Redis)
├── 💳 Payment Layer (Stripe integration)
├── 📢 Notification Layer (Firebase + Twilio)
└── 👨‍💼 Admin Layer (Complete management interface)
```

### **Key Technologies**
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for sessions and real-time data
- **Authentication**: JWT with role-based permissions
- **Real-time**: Socket.IO with Redis adapter
- **Payments**: Stripe with webhook handling
- **Notifications**: Firebase (push) + Twilio (SMS)
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest with comprehensive test suites

## 🚀 Quick Start

### Prerequisites
```bash
# Required software
Node.js >= 18.17.0
PostgreSQL >= 14
Redis >= 6.0
npm >= 9.0.0

# Optional (for full functionality)
Stripe CLI
Firebase project
Twilio account
```

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd uber-clone-nest

# Install dependencies
npm install

# Set up environment variables
cp env-config-template.txt .env
# Edit .env with your configuration

# Set up database
npm run db:setup

# Seed initial data
npm run db:seed

# Start development server
npm run start:dev
```

### Environment Configuration
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/uber_clone_db"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Admin Authentication
ADMIN_JWT_SECRET="admin-specific-secret-key"

# Stripe Payments
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Redis Cache
REDIS_URL="redis://localhost:6379"

# Firebase Notifications
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Twilio SMS
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="SK..."
TWILIO_PHONE_NUMBER="+1234567890"

# Application
PORT=3000
NODE_ENV="development"
```

## 📖 API Documentation

### **Swagger Documentation**
Access the complete API documentation at: `http://localhost:3000/api`

### **Authentication**
```bash
# User login
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Admin login
POST /admin/auth/login
{
  "email": "admin@example.com",
  "password": "admin_password"
}
```

### **Key Endpoints**

#### **User Endpoints**
```bash
GET    /users/profile          # Get user profile
PUT    /users/profile          # Update user profile
POST   /users/emergency-contact # Add emergency contact
GET    /users/rides            # Get user ride history
```

#### **Ride Endpoints**
```bash
POST   /rides                  # Create new ride
GET    /rides/:id              # Get ride details
PUT    /rides/:id/cancel       # Cancel ride
POST   /rides/:id/rate         # Rate completed ride
```

#### **Driver Endpoints**
```bash
GET    /drivers/status         # Get driver status
PUT    /drivers/status         # Update driver status
POST   /drivers/location       # Update location
GET    /drivers/rides          # Get available rides
```

#### **Admin Endpoints**
```bash
# Dashboard
GET    /admin/dashboard        # Get dashboard metrics
GET    /admin/dashboard/realtime # Real-time dashboard data

# User Management
GET    /admin/users            # List users with filters
GET    /admin/users/:id        # Get user details
PUT    /admin/users/:id/suspend # Suspend user

# Ride Management
GET    /admin/rides            # List rides with filters
POST   /admin/rides/:id/assign # Assign ride to driver
POST   /admin/rides/:id/complete # Complete ride manually

# Geography Management
GET    /admin/geography/countries # List countries
POST   /admin/geography/countries # Create country
GET    /admin/geography/zones   # List service zones

# Pricing Management
GET    /admin/pricing/tiers    # List pricing tiers
POST   /admin/pricing/tiers    # Create pricing tier
POST   /admin/pricing/calculate # Calculate ride pricing

# Configuration
GET    /admin/config/feature-flags # List feature flags
POST   /admin/config/api-keys   # Create API key
GET    /admin/config/api-keys/rotation/stats # API key rotation stats
```

## 🧪 Testing

### **Run Test Suites**
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:full

# With coverage
npm run test:cov
```

### **Performance Testing**
```bash
# Load testing
npm run test:load

# Stress testing
npm run test:stress
```

## 📊 Database Schema

### **Core Entities**
- **Users**: User profiles, authentication, preferences
- **Drivers**: Driver profiles, vehicles, documents, ratings
- **Rides**: Ride bookings, status, pricing, locations
- **Vehicles**: Vehicle types, capacities, requirements
- **Wallets**: User balances, transactions, payment methods
- **Promotions**: Discount codes, campaigns, usage tracking

### **Admin Entities**
- **AdminUsers**: Administrative user accounts
- **Countries**: Geographical countries with settings
- **States**: State/province configurations
- **Cities**: City-specific settings and pricing
- **ServiceZones**: Operational zones with pricing multipliers
- **RideTiers**: Pricing tiers (UberX, UberXL, Premium, etc.)
- **FeatureFlags**: Feature toggles for gradual rollouts
- **APIKeys**: Encrypted API keys for external services

### **Audit & Analytics**
- **AuditLogs**: Comprehensive audit trails
- **Notifications**: Notification history and delivery status
- **Reports**: Generated reports and analytics data

## 🔧 Development Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugger
npm run build             # Build for production

# Database
npm run db:setup          # Initial database setup
npm run db:seed           # Populate with test data
npm run db:reset          # Reset database
npm run db:dev            # Setup for development

# Code Quality
npm run lint              # ESLint checking
npm run format            # Prettier formatting
npm run test:cov          # Test coverage report

# Documentation
npm run docs:generate     # Generate API docs
```

## 🚀 Deployment

### **Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose up -d

# Production build
docker build -t uber-clone .
docker run -p 3000:3000 uber-clone
```

### **Railway/Render Deployment**
```bash
# Set environment variables in your platform
# Deploy automatically from main branch
```

### **Manual Deployment**
```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## 📚 Documentation

### **Complete Documentation**
- **[API Endpoints Guide](docs/API-ENDPOINTS-GUIDE.md)** - Complete endpoint reference
- **[Database Schema](docs/schema.md)** - Database structure and relationships
- **[Authentication Guide](docs/AUTHENTICATION-GUIDE.md)** - Auth implementation details
- **[Real-time Documentation](docs/realtime-tracking-guide.md)** - WebSocket implementation
- **[Testing Plan](docs/TESTING-PLAN.md)** - Comprehensive testing strategy

### **Admin Panel Documentation**
- **[Admin Dashboard Guide](docs/admindocs/dashboard-guide.md)** - Dashboard features
- **[Geography Management](docs/geography-module-overview.md)** - Zone management
- **[Pricing Configuration](docs/base-pricing-guide.md)** - Dynamic pricing setup
- **[API Keys Management](docs/api-keys-guide.md)** - Secure key management
- **[Feature Flags Guide](docs/feature-flags-guide.md)** - Feature rollout management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **Stripe** - Payment processing
- **Socket.IO** - Real-time communication
- **PostgreSQL** - Robust database
- **Redis** - High-performance caching

## 📞 Support

For support and questions:
- **Documentation**: Check the `/docs` folder
- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions for questions

---

**🚀 Built with modern technologies for scalable, maintainable, and secure ride-sharing platforms.**

