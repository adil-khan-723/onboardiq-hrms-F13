# AWS Trusted Advisor — Findings & Resolutions

> Run Trusted Advisor free checks from AWS Console → Trusted Advisor → Dashboard.
> Screenshots should be captured post-deploy and attached to this document.

## Expected Free-Tier Check Categories

Trusted Advisor free checks cover: Security, Service Limits, Fault Tolerance, Performance.

---

## Finding 1: S3 Bucket Permissions

**Check:** S3 Bucket Permissions  
**Likely finding:** Flags buckets with public access or missing bucket policies.

**Our status:** `hrms-onboarding-documents-*` has:
- `BlockPublicAcls: true`
- `BlockPublicPolicy: true`
- `IgnorePublicAcls: true`
- `RestrictPublicBuckets: true`
- Bucket policy enforces `aws:SecureTransport` (HTTPS-only)

**Resolution:** No action needed — already fully hardened. If Trusted Advisor still flags it (e.g., due to CORS `AllowedOrigins: ['*']`), this is intentional for the presigned URL upload flow and does not expose data publicly.

---

## Finding 2: IAM Use (Root Account / MFA)

**Check:** IAM Use  
**Likely finding:** Root account used recently, or MFA not enabled on root.

**Resolution:** Enable MFA on the AWS root account. Use IAM users or SSO roles for all day-to-day operations. Never use root credentials for deployments — use the IAM user/role configured in `samconfig.toml`.

Steps:
1. AWS Console → IAM → Dashboard → Activate MFA on root
2. Create dedicated IAM deployment role with least-privilege for SAM
3. Rotate any long-lived access keys

---

## Finding 3: Service Limits

**Check:** Lambda Concurrent Executions  
**Likely finding:** Account-level Lambda concurrency limit approaching (default 1,000).

**Resolution:** At 50 users/day with async Step Functions execution, peak concurrent Lambda executions will be well under 50. No action needed at current scale. Set a reserved concurrency limit of 100 on `hrms-create-employee` to protect downstream services if traffic spikes.

---

## Finding 4: CloudWatch Alarms on Auto Scaling

**Check:** CloudWatch Alarms (if applicable)  
**Likely finding:** No alarms configured (before this deployment).

**Resolution:** Resolved by this deployment — 12 CloudWatch alarms now defined in `template.yaml` covering error rate and duration for all Lambda functions, all wired to `hrms-hr-notifications` SNS topic.

---

## Finding 5: DynamoDB Read/Write Capacity

**Check:** DynamoDB Throughput  
**Likely finding:** On-demand tables not flagged, but provisioned tables with low utilization may appear.

**Resolution:** All 4 DynamoDB tables use `BillingMode: PAY_PER_REQUEST` (on-demand). No capacity planning required. Trusted Advisor will not flag these.
