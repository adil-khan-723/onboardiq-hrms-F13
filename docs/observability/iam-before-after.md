# IAM Hardening — Before & After

## Summary

Primary change: SES `Resource: '*'` → `Resource: arn:aws:ses:<region>:<account>:identity/*`

This scopes SES send permission to verified SES identities in the account only, rather than allowing calls to any SES endpoint globally.

---

## Lambda 1: `hrms-stage-document-collection`

### Before

```yaml
- Effect: Allow
  Action: [ses:SendEmail, ses:SendRawEmail]
  Resource: '*'
```

**Risk:** Could send email impersonating any SES identity in any account if credentials were exfiltrated. No account boundary enforced at IAM level.

### After

```yaml
- Effect: Allow
  Action: [ses:SendEmail, ses:SendRawEmail]
  Resource: !Sub arn:aws:ses:${AWS::Region}:${AWS::AccountId}:identity/*
- Effect: Allow
  Action: [xray:PutTraceSegments, xray:PutTelemetryRecords]
  Resource: '*'
```

**Improvement:** Scoped to this account's verified identities only. X-Ray write permission added (required for `Tracing: Active`).

---

## Lambda 2: `hrms-create-employee`

### Before

```yaml
- Effect: Allow
  Action:
    - cognito-idp:AdminCreateUser
    - cognito-idp:AdminSetUserPassword
  Resource: !GetAtt EmployeeCognitoUserPool.Arn   # already scoped ✓
- Effect: Allow
  Action: states:StartExecution
  Resource: !Ref OnboardingStateMachine             # already scoped ✓
- Effect: Allow
  Action: [ses:SendEmail, ses:SendRawEmail]
  Resource: '*'                                     # ← broad
```

### After

```yaml
- Effect: Allow
  Action:
    - cognito-idp:AdminCreateUser
    - cognito-idp:AdminSetUserPassword
  Resource: !GetAtt EmployeeCognitoUserPool.Arn
- Effect: Allow
  Action: states:StartExecution
  Resource: !Ref OnboardingStateMachine
- Effect: Allow
  Action: [ses:SendEmail, ses:SendRawEmail]
  Resource: !Sub arn:aws:ses:${AWS::Region}:${AWS::AccountId}:identity/*
- Effect: Allow
  Action: [xray:PutTraceSegments, xray:PutTelemetryRecords]
  Resource: '*'
```

**Improvement:** SES scoped to account identity ARNs. Cognito and Step Functions were already least-privilege (resource-scoped) — no change needed there.

---

## Other Lambdas

Same SES pattern applied to: `hrms-stage-it-provisioning`, `hrms-stage-policy-signoff`, `hrms-stage-manager-intro`, `hrms-send-reminder`, `hrms-document-upload-trigger`.

All Cognito and Step Functions permissions were already resource-scoped. DynamoDB uses SAM managed policies (`DynamoDBCrudPolicy`, `DynamoDBReadPolicy`) which auto-scope to the specific table ARN — no changes needed.
