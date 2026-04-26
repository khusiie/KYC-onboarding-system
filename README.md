# Playto Pay KYC System

A full-stack KYC (Know Your Customer) onboarding pipeline built for the Playto Founding Engineering Intern Challenge.

## 🚀 Features
- **Merchant Flow**: Multi-step onboarding (Personal, Business, Documents) with progress saving.
- **Reviewer Dashboard**: FIFO queue management with real-time metrics.
- **SLA Tracking**: Dynamic "At Risk" flagging for submissions pending > 24 hours.
- **State Machine**: Secure backend transition enforcement.
- **File Security**: Strict server-side validation for type and size.
- **Notifications**: Audit logging for all state transitions.

## 🛠️ Tech Stack
- **Backend**: Django 6.0, Django REST Framework
- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Database**: SQLite (Development)
- **Auth**: DRF Token Authentication

## 🏁 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and configure your `.env` file (see `.env.example` or use the database URL provided).
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations and seed data:
   ```bash
   python manage.py migrate
   python manage.py seed_data
   ```
5. Start the server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🧪 Test Credentials
| Role | Username | Password |
| :--- | :--- | :--- |
| **Reviewer** | `reviewer1` | `password123` |
| **Merchant (Draft)** | `merchant_draft` | `password123` |
| **Merchant (Under Review)** | `merchant_review` | `password123` |
| **Merchant (Approved)** | `merchant_approved` | `password123` |

## 🌐 Deployment
This project is configured for deployment on **Render** (Backend) and **Vercel** (Frontend).

- **Backend Deployment URL**: `[INSERT_RENDER_URL_HERE]`
- **Frontend Deployment URL**: `[INSERT_VERCEL_URL_HERE]`

Detailed deployment steps can be found in [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md).

## 📄 Documentation
- **[EXPLAINER.md](./EXPLAINER.md)**: Detailed explanation of the State Machine, File Validation, SLA tracking, and Auth logic (Requirement for the challenge).
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)**: The original roadmap used to build this project.
