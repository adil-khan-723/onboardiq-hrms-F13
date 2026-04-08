# 
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OnboardIQ** — a full-stack employee onboarding platform with a React/Vite frontend and AWS Serverless backend (SAM/Lambda/Step Functions).

## Commands

### Frontend (`onboarding-app/`)
```bash
npm run dev       # Vite dev server
npm run build     # Production build
npm run preview   # Preview production build
```

### Backend (`onboarding-backend/`)
```bash
cd layers/common/nodejs && npm install   # Install shared Lambda layer deps (run first)
sam build                                 # Build SAM stack
sam deploy --guided                       # First deploy (interactive)
sam deploy                                # Subsequent deploys
sam delete --stack-name hrms-onboarding-stack  # Teardown

# Logs
sam logs -n <FunctionName> --stack-name hrms-onboarding-stack --tail
```

## Architecture

### Frontend (`onboarding-app/src/`)
- **`App.jsx`** — React Router: `/` → LandingPage, `/portal` → NewHirePortal, `/dashboard` → HRDashboard
- **`api.js`** — Centralized API client; reads `VITE_API_BASE_URL` from env
- **Pages**: LandingPage (marketing), NewHirePortal (5-step new hire wizard), HRDashboard (HR admin view)
- Env vars in `.env.development` / `.env.production`: API URL, Cognito pool/client IDs, S3 bucket, region

### Backend (`onboarding-backend/`)
The system is orchestrated by an **AWS Step Functions state machine** (`statemachine/onboarding.asl.json`) that drives employees through 4 sequential stages:

1. **Document Collection** — presigned S3 URLs for upload; retries up to 3× with 24h waits
2. **IT Provisioning** — creates Cognito user, sends temporary credentials; 1h retry loop
3. **Policy Sign-off** — sends 5-policy acknowledgment email; 24h wait before retry
4. **Manager Introduction** — notifies manager, sends intro email

**Lambda functions** (in `functions/`): one per workflow stage plus `create-employee`, `progress-api`, `document-upload-trigger`, `reminder`, `s3-notification-setup`.

**Shared code** lives in `layers/common/nodejs/` — imported by all Lambda functions as a Lambda Layer. AWS SDK v3 clients (DynamoDB, SES, Cognito, S3, Step Functions, SNS) are declared here.

**AWS resources** (defined in `template.yaml`):
- 4 DynamoDB tables: `hrms-employees`, `hrms-onboarding-workflows`, `hrms-onboarding-stages`, `hrms-documents`
- Cognito User Pool for new hire accounts
- S3 bucket for uploaded documents
- SES for transactional emails, SNS for HR admin notifications
- API Gateway REST API (employee creation + progress endpoints)

### Deployment Config
- Stack name: `hrms-onboarding-stack`, region: `ap-south-1` (Mumbai)
- `samconfig.toml` holds SAM deployment defaults including SES sender/HR email parameter overrides
- See `onboarding-backend/DEPLOY.md` for full deployment walkthrough including SES identity verification
