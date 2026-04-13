# Step Functions Execution History
## OnboardIQ — HRMS Employee Onboarding Workflow

**Execution:** `onboarding-EMP-4FEA92A3-1775641312919`  
**Status:** ✅ SUCCEEDED  
**Employee:** Arjun Sharma (EMP-4FEA92A3) — Product Manager, Product Dept  
**Start:** 2026-04-08 15:11:53 IST  
**End:**   2026-04-08 15:12:59 IST  
**Duration:** ~66 seconds (end-to-end across all 4 stages)

---

## State Machine: `hrms-onboarding-workflow`

```
arn:aws:states:ap-south-1:736786104206:stateMachine:hrms-onboarding-workflow
```

---

## Execution Timeline

| Time (IST)   | State                      | Event                          |
|--------------|----------------------------|--------------------------------|
| 15:11:53.054 | **DocumentCollection**     | → Task entered                 |
| 15:11:54.394 | DocumentCollection         | ← Task exited (docs pending)   |
| 15:11:54.394 | CheckDocumentsComplete     | Choice: docs not yet received  |
| 15:11:54.394 | CheckDocumentReminderLimit | Choice: attempt 0 < 3, proceed |
| 15:11:54.394 | SendDocumentReminder       | → Reminder Lambda invoked      |
| 15:11:54.677 | SendDocumentReminder       | ← Reminder sent                |
| 15:11:54.677 | IncrementReminderAttempt   | Pass: attempt 0 → 1            |
| 15:11:54.677 | **WaitForDocuments**       | ⏳ Waiting 30 seconds          |
| 15:12:24.724 | WaitForDocuments           | ← Wait complete                |
| 15:12:24.724 | ReCheckDocuments           | → Re-check Lambda invoked      |
| 15:12:25.234 | ReCheckDocuments           | ← All 3 documents received ✓  |
| 15:12:25.234 | CheckDocumentsComplete     | Choice: allDocumentsReceived = true → advance |
| 15:12:25.234 | **ITProvisioning**         | → Cognito user creation Lambda |
| 15:12:26.938 | ITProvisioning             | ← Cognito user created ✓      |
| 15:12:26.938 | CheckITComplete            | Choice: cognitoUserCreated = true → advance |
| 15:12:26.938 | **PolicySignoff**          | → Policy sign-off Lambda       |
| 15:12:27.239 | PolicySignoff              | ← Policy signed (signed_at set in DynamoDB) |
| 15:12:27.239 | **WaitForPolicySignoff**   | ⏳ Waiting 30 seconds          |
| 15:12:57.281 | WaitForPolicySignoff       | ← Wait complete                |
| 15:12:57.281 | ReCheckPolicies            | → Re-check Lambda invoked      |
| 15:12:57.510 | ReCheckPolicies            | ← allPoliciesSigned = true ✓  |
| 15:12:57.510 | CheckPolicyComplete        | Choice: policies signed → advance |
| 15:12:57.510 | **ManagerIntro**           | → Manager intro Lambda         |
| 15:12:59.609 | ManagerIntro               | ← Manager intro email sent ✓  |
| 15:12:59.609 | **OnboardingComplete**     | ✅ Succeed state entered       |
| 15:12:59.627 | —                          | **EXECUTION SUCCEEDED**        |

---

## Stage Summary

| Stage | Lambda | Result | Duration |
|-------|--------|--------|----------|
| Document Collection | `hrms-stage-document-collection` | ✅ All 3 docs received | ~32s (incl. 30s wait) |
| IT Provisioning | `hrms-stage-it-provisioning` | ✅ Cognito user created | ~1.7s |
| Policy Sign-off | `hrms-stage-policy-signoff` | ✅ All 5 policies signed | ~30.3s (incl. 30s wait) |
| Manager Intro | `hrms-stage-manager-intro` | ✅ Intro email sent | ~2.1s |

---

## AWS Console Screenshot Instructions

To capture the visual execution graph for your submission:

1. Open: https://ap-south-1.console.aws.amazon.com/states/home?region=ap-south-1#/statemachines/view/arn:aws:states:ap-south-1:736786104206:stateMachine:hrms-onboarding-workflow
2. Click **Executions** tab
3. Click execution `onboarding-EMP-4FEA92A3-1775641312919`
4. Screenshot the **Graph view** (shows green checkmarks on all states)
5. Screenshot the **Events** tab (shows full timeline like above)

---

## DynamoDB Stage Status After Completion

| Stage | Status | Completed At |
|-------|--------|--------------|
| DOCUMENT_COLLECTION | COMPLETE | 2026-04-08T09:34:08Z |
| IT_PROVISIONING | COMPLETE | 2026-04-08T09:34:10Z |
| POLICY_SIGNOFF | COMPLETE | 2026-04-08T09:34:40Z |
| MANAGER_INTRO | COMPLETE | 2026-04-08T09:34:42Z |
