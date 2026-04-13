# Cost Estimate — 50 Onboarding Events/Month
## OnboardIQ HRMS · AWS ap-south-1 (Mumbai)

**Assumptions:**
- 50 new hires onboarded per month
- Each hire: 1 Step Functions execution, ~15 Lambda invocations, 3 S3 uploads, ~8 SES emails, 1 Cognito user
- DynamoDB: 4 workflow records + 4 stage records + 3 document records per hire = 11 writes + reads across the month
- API Gateway: ~200 requests/month (dashboard polling + form submissions)
- All prices in USD, ap-south-1 region, as of 2025

---

## Service-by-Service Breakdown

### 1. AWS Lambda
| Item | Calculation | Cost/month |
|------|-------------|------------|
| Invocations | 50 hires × 15 invocations = 750 total | Free (1M free tier) |
| Compute (256MB, ~500ms avg) | 750 × 0.5s × 0.25GB = 93.75 GB-sec | Free (400K GB-sec free tier) |
| **Lambda Total** | | **$0.00** |

---

### 2. AWS Step Functions
| Item | Calculation | Cost/month |
|------|-------------|------------|
| State transitions | 50 executions × ~33 transitions each = 1,650 transitions | First 4,000/month free |
| **Step Functions Total** | | **$0.00** |

---

### 3. Amazon DynamoDB
| Item | Calculation | Cost/month |
|------|-------------|------------|
| Write Request Units (WRU) | 50 hires × ~30 writes = 1,500 WRUs | Free (1M WRU free tier) |
| Read Request Units (RRU) | ~5,000 reads (dashboard + Lambda checks) | Free (25 RCU always free + 2.5M RRU free tier) |
| Storage | 50 records × ~2KB each = ~100KB | Free (25GB always free) |
| **DynamoDB Total** | | **$0.00** |

---

### 4. Amazon S3
| Item | Calculation | Cost/month |
|------|-------------|------------|
| Storage | 50 hires × 3 docs × avg 500KB = 75MB | $0.023/GB → **$0.002** |
| PUT requests | 50 × 3 = 150 PUT requests | $0.0054/1000 → **$0.001** |
| GET requests | ~500 reads (HR dashboard doc previews) | $0.00043/1000 → **$0.001** |
| Data transfer | ~150MB outbound | Free (1GB/month free) |
| **S3 Total** | | **~$0.004** |

---

### 5. Amazon SES (Simple Email Service)
| Item | Calculation | Cost/month |
|------|-------------|------------|
| Emails sent | 50 hires × 8 emails (welcome, doc reminder, policy, manager intro ×2, HR notifications) = 400 emails | $0.10/1000 emails |
| **SES Total** | | **$0.04** |

---

### 6. Amazon Cognito
| Item | Calculation | Cost/month |
|------|-------------|------------|
| Monthly Active Users | 50 new users created; assume 50 MAU | First 50,000 MAU free |
| **Cognito Total** | | **$0.00** |

---

### 7. Amazon SNS
| Item | Calculation | Cost/month |
|------|-------------|------------|
| Notifications | 50 HR notifications (one per hire when docs complete) | First 1M free |
| **SNS Total** | | **$0.00** |

---

### 8. Amazon API Gateway
| Item | Calculation | Cost/month |
|------|-------------|------------|
| REST API calls | 50 form submissions + 50 policy signoffs + ~100 dashboard refreshes = ~200 requests | $3.50/million → **$0.001** |
| **API Gateway Total** | | **~$0.001** |

---

### 9. AWS CloudFormation / SAM
- No additional charge — CloudFormation is free.

---

### 10. Data Transfer (General)
| Item | Cost/month |
|------|------------|
| S3 → Internet (doc downloads) | Free up to 1GB |
| API Gateway → Internet | Included above |
| **Data Transfer Total** | **$0.00** |

---

## Monthly Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| AWS Lambda | $0.00 |
| AWS Step Functions | $0.00 |
| Amazon DynamoDB | $0.00 |
| Amazon S3 | $0.004 |
| Amazon SES | $0.04 |
| Amazon Cognito | $0.00 |
| Amazon SNS | $0.00 |
| Amazon API Gateway | $0.001 |
| **TOTAL** | **~$0.045/month** |

---

## Cost at Scale

| Monthly Hires | Estimated Cost |
|---------------|---------------|
| 50 (current estimate) | ~$0.05 |
| 500 | ~$0.50 |
| 5,000 | ~$5.00 |
| 50,000 | ~$50.00 |

The system scales linearly and stays well within AWS free tier limits at 50 hires/month. All major compute costs (Lambda, Step Functions, DynamoDB, Cognito) are fully covered by the AWS free tier at this scale.

---

## Notes

- Prices based on AWS ap-south-1 pricing (Mumbai region), April 2026
- SES is in sandbox mode during development; production mode requires SES sending limit increase request
- S3 versioning is enabled on the document bucket — storage costs would double if keeping all versions (still negligible at this scale)
- CloudWatch Logs (Lambda + Step Functions) cost ~$0.57/GB ingested; at this scale logging is minimal (<10MB/month) → effectively $0.00
- If the frontend is moved from S3 static hosting to CloudFront, add ~$0.01/month for CDN at this scale
