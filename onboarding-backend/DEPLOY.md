# HRMS Onboarding Backend — Deployment Guide

## Prerequisites
- AWS CLI configured (`aws configure`)
- AWS SAM CLI installed (`pip install aws-sam-cli`)
- Node.js 20.x installed
- Region: ap-south-1 (Mumbai)

---

## Step 1 — Install layer dependencies

```bash
cd layers/common/nodejs
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-ses @aws-sdk/client-sns @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/client-cognito-identity-provider @aws-sdk/client-sfn uuid
cd ../../..
```

---

## Step 2 — Verify SES email addresses

Before deploying, verify both sender and HR email in SES:

```bash
# Verify sender email
aws ses verify-email-identity \
  --email-address onboarding@yourcompany.com \
  --region ap-south-1

# Verify HR email
aws ses verify-email-identity \
  --email-address hr@yourcompany.com \
  --region ap-south-1
```

Check your inboxes and click the verification links.

---

## Step 3 — Build

```bash
sam build
```

---

## Step 4 — Deploy (first time)

```bash
sam deploy --guided
```

When prompted:
- Stack name: `hrms-onboarding-stack`
- Region: `ap-south-1`
- SESFromEmail: your verified sender email
- HREmail: your HR email
- Environment: `dev`
- Confirm changeset: `Y`
- Allow SAM to create IAM roles: `Y`

For subsequent deploys:
```bash
sam deploy
```

---

## Step 5 — Note the outputs

After deploy, SAM prints outputs. Save these:

```
ApiBaseUrl          = https://xxxxxxx.execute-api.ap-south-1.amazonaws.com/dev
DocumentBucketName  = hrms-onboarding-documents-XXXXXXXXXXXX-dev
CognitoUserPoolId   = ap-south-1_XXXXXXXXX
CognitoClientId     = XXXXXXXXXXXXXXXXXXXXXXXXXX
StateMachineArn     = arn:aws:states:ap-south-1:...
```

---

## Step 6 — Update frontend .env

Create `onboarding-app/.env.production`:

```
VITE_API_BASE_URL=https://xxxxxxx.execute-api.ap-south-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_DOCUMENT_BUCKET=hrms-onboarding-documents-XXXXXXXXXXXX-dev
VITE_REGION=ap-south-1
```

---

## Step 7 — Build and deploy frontend to S3

```bash
cd onboarding-app
npm run build

# Create frontend bucket (one time)
aws s3 mb s3://hrms-onboarding-frontend-dev --region ap-south-1

# Enable static website hosting
aws s3 website s3://hrms-onboarding-frontend-dev \
  --index-document index.html \
  --error-document index.html

# Set public read policy
aws s3api put-bucket-policy \
  --bucket hrms-onboarding-frontend-dev \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::hrms-onboarding-frontend-dev/*"
    }]
  }'

# Upload build
aws s3 sync dist/ s3://hrms-onboarding-frontend-dev --delete

cd ..
```

Frontend URL: `http://hrms-onboarding-frontend-dev.s3-website.ap-south-1.amazonaws.com`

---

## Useful commands

```bash
# View Step Functions executions
aws stepfunctions list-executions \
  --state-machine-arn <StateMachineArn> \
  --region ap-south-1

# Tail Lambda logs
sam logs -n hrms-create-employee --tail --region ap-south-1

# Test create employee API
curl -X POST https://your-api/dev/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Arjun",
    "lastName": "Sharma",
    "email": "arjun@example.com",
    "department": "Engineering",
    "role": "Software Engineer",
    "employmentType": "Full-time",
    "joiningDate": "2025-09-01"
  }'

# Tear down everything
sam delete --stack-name hrms-onboarding-stack --region ap-south-1
```

---

## Architecture recap

```
React Frontend (S3)
      ↓
API Gateway (REST)
      ↓
Lambda: create-employee  ──→  DynamoDB (4 tables)
      ↓                   ──→  Cognito (user pool)
Step Functions            ──→  SES (welcome email)
  ├─ Doc Collection Lambda
  ├─ IT Provisioning Lambda ──→ Cognito
  ├─ Policy Signoff Lambda  ──→ SES
  └─ Manager Intro Lambda   ──→ SES
      (24h wait + reminders)

S3 upload ──→ Lambda trigger ──→ DynamoDB + SNS → HR email
```
