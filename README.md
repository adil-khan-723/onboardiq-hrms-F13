# OnboardIQ — Smart Employee Onboarding & Identity Service

> From offer letter acceptance to Day 1 login — fully automated on AWS.

[![AWS](https://img.shields.io/badge/AWS-Serverless-orange?logo=amazonaws)](https://aws.amazon.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react)](https://react.dev)
[![Step Functions](https://img.shields.io/badge/Workflow-Step%20Functions-FF4F8B?logo=amazonaws)](https://aws.amazon.com/step-functions/)
[![DynamoDB](https://img.shields.io/badge/Database-DynamoDB-4053D6?logo=amazonaws)](https://aws.amazon.com/dynamodb/)

---

## Overview

OnboardIQ is a fully automated, cloud-native employee onboarding platform built as an internship project. It handles everything from document collection to IT account provisioning through a 4-stage AWS Step Functions workflow — zero manual intervention required.

**Two portals:**
- **New Hire Portal** — 5-step self-service wizard (profile → documents → policies → manager intro → complete)
- **HR Admin Dashboard** — Real-time pipeline view with per-stage tracking for every employee

---

## Architecture

```
Frontend (React/Vite on S3)
        ↓
API Gateway (REST)
        ↓
AWS Lambda (9 functions, Node.js 20, ARM64)
        ↓
Step Functions State Machine
   ├── Stage 1: Document Collection  → S3 + DynamoDB
   ├── Stage 2: IT Provisioning      → Cognito + SES
   ├── Stage 3: Policy Sign-off      → DynamoDB
   └── Stage 4: Manager Intro        → SES
        ↓
DynamoDB (4 tables) · S3 (encrypted) · Cognito · SES · SNS
```

---

## AWS Services Used

| Service | Purpose |
|---------|---------|
| **AWS Lambda** | 9 serverless functions — one per workflow stage + API handlers |
| **AWS Step Functions** | Orchestrates the 4-stage onboarding pipeline |
| **Amazon DynamoDB** | 4 tables: employees, workflows, stages, documents |
| **Amazon S3** | Encrypted document storage + static website hosting |
| **Amazon Cognito** | Auto-provisions user accounts with temporary credentials |
| **Amazon SES** | Transactional emails — welcome, reminders, introductions |
| **Amazon SNS** | HR team alerts when documents are received |
| **Amazon API Gateway** | REST API routing frontend to Lambda |
| **AWS SAM** | Infrastructure as Code — entire stack in `template.yaml` |

---

## Project Structure

```
onboardiq-hrms-F13/
├── onboarding-app/              # React/Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── NewHirePortal.jsx
│   │   │   └── HRDashboard.jsx
│   │   ├── components/
│   │   │   └── SplashScreen.jsx
│   │   └── api.js               # Centralized API client
│   └── .env.development         # VITE_API_BASE_URL, Cognito config
│
├── onboarding-backend/          # AWS SAM backend
│   ├── template.yaml            # Full SAM/CloudFormation stack
│   ├── samconfig.toml           # Deployment config
│   ├── functions/
│   │   ├── create-employee/     # POST /employees
│   │   ├── progress-api/        # GET+PUT /employees/{id}/progress
│   │   ├── document-upload-url/ # POST /documents/upload-url
│   │   ├── document-upload-trigger/  # S3 event trigger
│   │   ├── document-collection/ # Step Functions stage 1
│   │   ├── it-provisioning/     # Step Functions stage 2
│   │   ├── policy-signoff/      # Step Functions stage 3
│   │   ├── manager-intro/       # Step Functions stage 4
│   │   └── reminder/            # SES reminder emails
│   ├── layers/common/nodejs/    # Shared Lambda layer (utils, AWS SDK)
│   └── statemachine/
│       └── onboarding.asl.json  # Step Functions definition
│
└── deliverables/                # Project documentation
    ├── OnboardIQ-Presentation.pptx
    ├── 01-stepfunctions-execution-history.md
    ├── 02-er-diagram.md
    ├── 03-video-demo-script.md
    └── 04-cost-estimate.md
```

---

## Database Schema

4 DynamoDB tables:

| Table | Primary Key | GSI | Purpose |
|-------|-------------|-----|---------|
| `hrms-employees` | `employee_id` | — | Employee profile + status |
| `hrms-onboarding-workflows` | `workflow_id` | `employee-index` | Workflow state per employee |
| `hrms-onboarding-stages` | `stage_id` | `workflow-index` | 4 stage records per workflow |
| `hrms-documents` | `document_id` | `employee-index` | Upload records + S3 keys |

---

## Getting Started

### Prerequisites
- Node.js 20+
- AWS CLI configured (`aws configure`)
- AWS SAM CLI (`brew install aws-sam-cli`)

### Backend Deployment

```bash
cd onboarding-backend

# Install shared Lambda layer dependencies
cd layers/common/nodejs && npm install && cd ../../..

# Build and deploy
sam build
sam deploy --guided   # first time (sets up samconfig.toml)
sam deploy            # subsequent deploys
```

### Frontend Setup

```bash
cd onboarding-app
npm install

# Copy and fill in your values
cp .env.development.example .env.development
# VITE_API_BASE_URL=https://your-api-id.execute-api.ap-south-1.amazonaws.com/dev
# VITE_COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXX
# VITE_COGNITO_CLIENT_ID=your-client-id

npm run dev           # local dev server
npm run build         # production build

# Deploy to S3
aws s3 sync dist/ s3://your-frontend-bucket/ --delete
```

### HR Dashboard PIN
Default: `1234`

---

## The 4-Stage Workflow

```
New Hire Submits Form
        │
        ▼
┌─────────────────────┐
│  Document Collection │  ← Validates 3 uploads in S3
│  ID · Degree · Offer │    Sends HR SNS notification
└──────────┬──────────┘
           │ all docs received
           ▼
┌─────────────────────┐
│   IT Provisioning   │  ← Creates Cognito account
│   Cognito + SES     │    Emails temporary credentials
└──────────┬──────────┘
           │ account created
           ▼
┌─────────────────────┐
│   Policy Sign-off   │  ← Employee signs 5 policies
│   5 acknowledgements│    Recorded with timestamp
└──────────┬──────────┘
           │ all signed
           ▼
┌─────────────────────┐
│   Manager Intro     │  ← Emails employee + manager
│   Day 1 readiness   │    Status → ACTIVE
└─────────────────────┘
```

Each stage has automatic reminder emails (every 30s in demo, 24h in production) and retries up to 3× before marking overdue.

---

## Cost Estimate

**50 hires/month: ~$0.05**

| Service | Cost |
|---------|------|
| Lambda, Step Functions, DynamoDB, Cognito, SNS | $0.00 (free tier) |
| S3 storage + requests | ~$0.004 |
| SES (400 emails) | ~$0.04 |
| API Gateway | ~$0.001 |
| **Total** | **~$0.05/month** |

Scales to 5,000 hires/month for ~$5.00.

---

## Deployment Info

| Resource | Value |
|----------|-------|
| Region | `ap-south-1` (Mumbai) |
| Stack | `hrms-onboarding-stack` |
| State Machine | `hrms-onboarding-workflow` |

---

## Tech Stack

```
Frontend:   React 18 · Vite · React Router · CSS Modules · Lucide Icons
Backend:    Node.js 20 · AWS Lambda (ARM64) · AWS SAM
Database:   Amazon DynamoDB
Storage:    Amazon S3 (AES-256 encrypted)
Workflow:   AWS Step Functions
Auth:       Amazon Cognito
Email:      Amazon SES
Alerts:     Amazon SNS
API:        Amazon API Gateway
IaC:        AWS SAM + CloudFormation
```

---

*Internship Project · OnboardIQ HRMS · 2026*
