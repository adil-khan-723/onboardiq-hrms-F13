# Cost Estimate — OnboardIQ (50 users/day)

**Region:** ap-south-1 (Mumbai)  
**Assumption:** 50 new hires onboarded per day, each triggering ~20 Lambda invocations across the workflow. Average Lambda duration 500ms, 256MB memory.

---

## Monthly Estimates

### Lambda

| Metric | Value |
|--------|-------|
| Invocations/day | 50 users × 20 invocations = 1,000 |
| Invocations/month | 31,000 |
| Duration/invocation | 500ms avg |
| Memory | 256 MB |
| GB-seconds/month | 31,000 × 0.5s × 0.25 GB = **3,875 GB-s** |
| Free tier | 400,000 GB-s / month |
| **Lambda cost** | **$0.00** (within free tier) |

### API Gateway (REST)

| Metric | Value |
|--------|-------|
| Requests/day | ~150 (50 users × 3 API calls) |
| Requests/month | ~4,650 |
| Price per million | $3.50 |
| **API Gateway cost** | **~$0.02** |

### DynamoDB (On-Demand)

| Metric | Value |
|--------|-------|
| Write units/month | ~50,000 WCU (50 users × ~1,000 writes across 4 tables) |
| Read units/month | ~200,000 RCU |
| Write cost ($1.4285/million WCU) | ~$0.07 |
| Read cost ($0.285/million RCU) | ~$0.06 |
| Storage (< 1 GB) | ~$0.285 |
| **DynamoDB cost** | **~$0.42** |

### S3 (Document Storage)

| Metric | Value |
|--------|-------|
| Uploads/month | 50 users × 3 docs = 150 objects |
| Avg doc size | 2 MB → 300 MB total |
| Storage cost ($0.025/GB) | ~$0.01 |
| PUT requests (150) | ~$0.001 |
| GET requests (~300) | ~$0.001 |
| **S3 cost** | **~$0.01** |

### SES (Email)

| Metric | Value |
|--------|-------|
| Emails/user | ~8 (welcome, IT creds, 5 policies, manager intro, reminder) |
| Emails/month | 50 × 8 × 30 = 12,000 |
| Price per 1,000 | $0.10 |
| **SES cost** | **~$1.20** |

### Cognito

| Metric | Value |
|--------|-------|
| MAU | 50 (new hires only, not returning) |
| Free tier | 50,000 MAU |
| **Cognito cost** | **$0.00** |

### Step Functions

| Metric | Value |
|--------|-------|
| State transitions/user | ~20 |
| Transitions/month | 50 × 20 × 30 = 30,000 |
| Free tier | 4,000 transitions/month |
| Paid transitions | 26,000 × $0.000025 | 
| **Step Functions cost** | **~$0.65** |

### CloudWatch

| Metric | Value |
|--------|-------|
| Log ingestion (~500MB/month) | $0.50/GB → ~$0.25 |
| Dashboard (1) | $3.00/month |
| Alarms (12 alarms) | $0.10/alarm → $1.20 |
| **CloudWatch cost** | **~$4.45** |

### SNS

| Metric | Value |
|--------|-------|
| Notifications/month | ~200 (alarms + HR notifications) |
| Free tier | 1,000,000 |
| **SNS cost** | **$0.00** |

---

## Total Monthly Estimate

| Service | Cost |
|---------|------|
| Lambda | $0.00 |
| API Gateway | $0.02 |
| DynamoDB | $0.42 |
| S3 | $0.01 |
| SES | $1.20 |
| Cognito | $0.00 |
| Step Functions | $0.65 |
| CloudWatch | $4.45 |
| SNS | $0.00 |
| **TOTAL** | **~$6.75/month** |

> Note: X-Ray costs ~$5 per million traces recorded. At 50 users/day with 20 traces each = 31,000 traces/month — within the 100,000 free-tier traces. **X-Ray cost: $0.00**
