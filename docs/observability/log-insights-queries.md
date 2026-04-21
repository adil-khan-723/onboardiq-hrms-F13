# CloudWatch Log Insights Queries — OnboardIQ

## Critical Operational Question
**"Which onboarding stage is failing most frequently, and what error is causing it?"**

This is the single most actionable question for ops: a stalled onboarding workflow blocks a new hire's start.

### Query — Stage Failure Heatmap

Run against log groups:
- `/aws/lambda/hrms-stage-document-collection`
- `/aws/lambda/hrms-stage-it-provisioning`
- `/aws/lambda/hrms-stage-policy-signoff`
- `/aws/lambda/hrms-stage-manager-intro`

```
fields @timestamp, @logStream, @message
| filter @message like /ERROR/ or @message like /Task timed out/ or @message like /Unhandled/
| parse @message "* *" as level, errorMsg
| stats count(*) as errorCount by @logStream, errorMsg
| sort errorCount desc
| limit 20
```

### Query — End-to-End Onboarding Latency (Step Functions via Lambda)

Run against `/aws/lambda/hrms-create-employee`:

```
fields @timestamp, @duration, @billedDuration, @memorySize, @maxMemoryUsed
| filter @type = "REPORT"
| stats avg(@duration) as avgMs, max(@duration) as maxMs, pct(@duration, 99) as p99Ms, count() as invocations
| sort avgMs desc
```

### Query — X-Ray Trace Errors (use in X-Ray console, not Log Insights)

In X-Ray Service Map, filter:
- Time range: last 1 hour
- Filter expression: `error = true AND service(id(name: "hrms-*"))`
