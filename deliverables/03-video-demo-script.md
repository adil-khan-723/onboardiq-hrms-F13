# Video Demo Script
## OnboardIQ — Full New Hire Journey: Form Fill → Day 1 Login
### Estimated Runtime: 4–6 minutes

---

## Setup Before Recording

- Open two browser windows side-by-side:
  - **Left:** New Hire Portal — http://hrms-onboarding-frontend-dev.s3-website.ap-south-1.amazonaws.com
  - **Right:** HR Admin Dashboard — same URL, click HR Admin
- Open AWS Console tab: Step Functions → hrms-onboarding-workflow
- Open AWS Console tab: DynamoDB → hrms-onboarding-stages table
- Make sure screen recording software is running (OBS, QuickTime, Loom)

---

## Scene 1 — Landing Page (0:00–0:30)

**Narrate:**
> "This is OnboardIQ — a fully automated employee onboarding system built on AWS. When a new hire accepts their offer letter, everything from account provisioning to policy acknowledgement is handled automatically through a Step Functions workflow."

**Actions:**
1. Open the landing page — let the splash animation play
2. Point out the two portals: New Hire Portal and HR Admin Dashboard
3. Briefly mention the feature tags at the bottom: Cognito, S3, Step Functions, SES

---

## Scene 2 — New Hire Portal: Profile Step (0:30–1:30)

**Narrate:**
> "The new hire starts here. They fill in their personal details — name, email, department, role, and joining date. When they click Continue, a Lambda function immediately creates their employee record in DynamoDB and kicks off the Step Functions onboarding workflow."

**Actions:**
1. Click **New Hire Portal**
2. Let the splash animate
3. Fill in the form:
   - First Name: `Priya`
   - Last Name: `Menon`
   - Email: `priya.menon@example.com`
   - Phone: `+91 98765 43210`
   - Joining Date: today's date
   - Department: `Engineering`
   - Role: `Frontend Engineer`
   - Employment Type: `Full-time`
4. Click **Continue** — show the loading spinner briefly
5. Say: *"Employee record created in DynamoDB. Step Functions execution started."*

---

## Scene 3 — Document Upload Step (1:30–2:30)

**Narrate:**
> "Step 2 is document collection. The new hire uploads three required documents — a government ID, degree certificate, and signed offer letter. Files go directly to S3 using presigned URLs, with server-side encryption. A Lambda function validates file type and size on upload."

**Actions:**
1. On the Documents step, upload 3 files (use any 3 small PDFs from your desktop)
2. Point out the **Uploaded** badge appearing on each card
3. Click **Continue**
4. Say: *"An S3 event trigger fires for each upload. Once all 3 are received, the Document Collection stage is marked Complete and HR gets an SNS notification."*

---

## Scene 4 — Policy Sign-off Step (2:30–3:15)

**Narrate:**
> "Step 3 is policy acknowledgement. The new hire must read and sign all 5 company policies. The progress bar fills as each policy is checked. Once all 5 are acknowledged, this is recorded in DynamoDB and the Step Functions workflow advances."

**Actions:**
1. Check all 5 policy checkboxes one by one — show the progress bar filling
2. Click **Continue**

---

## Scene 5 — Manager Intro Step + Completion (3:15–3:45)

**Narrate:**
> "Step 4 is the manager introduction. An email is automatically sent to both the new hire and their reporting manager on the joining date. The new hire can also add questions for their manager."

**Actions:**
1. Type a note: `"What does the first week look like?"`
2. Click **Submit & Complete**
3. Let the Complete screen appear with all the status badges

---

## Scene 6 — HR Admin Dashboard (3:45–5:00)

**Narrate:**
> "Now switch to the HR Admin Dashboard. This is what the HR team sees — a real-time view of every employee's onboarding pipeline."

**Actions:**
1. Navigate to the HR Admin Dashboard
2. Enter PIN: `1234`
3. Show the smooth fade-in to the dashboard
4. Point out the stats bar: total employees, in progress, completed
5. Find Priya Menon in the table — show her progress bar
6. Click her row to expand the detail panel
7. Show the 4 stages with timestamps:
   - Document Collection: ✓ Complete
   - IT Provisioning: ✓ Complete (Cognito account created)
   - Policy Sign-off: ✓ Complete
   - Manager Intro: ✓ Complete
8. Say: *"All 4 stages completed automatically. Priya now has a Cognito account with temporary credentials waiting in her email."*

---

## Scene 7 — AWS Console: Step Functions (5:00–5:45)

**Narrate:**
> "Behind the scenes, here's what AWS Step Functions shows for this execution."

**Actions:**
1. Switch to the Step Functions AWS console tab
2. Open the execution for this run
3. Show the **Graph view** — all states highlighted green
4. Click through the timeline: DocumentCollection → WaitForDocuments → ITProvisioning → PolicySignoff → WaitForPolicySignoff → ManagerIntro → OnboardingComplete
5. Say: *"The entire workflow completed in under 2 minutes. In production this uses 24-hour waits between reminder checks — today we're demoing with 30-second waits for speed."*

---

## Scene 8 — DynamoDB Evidence (5:45–6:15)

**Narrate:**
> "And here's the DynamoDB record showing the canonical employee identity that every other HRMS service will reference."

**Actions:**
1. Open DynamoDB → `hrms-employees` table
2. Find Priya Menon's record
3. Show key attributes: employee_id, cognito_user_id, status=ACTIVE, department, role, joining_date
4. Open `hrms-onboarding-stages` table — show all 4 stages with status=COMPLETE

**Close with:**
> "This is OnboardIQ — from offer letter to Day 1 readiness, fully automated on AWS."

---

## Recording Tips

- Use **Loom** (loom.com) for easy browser recording + instant share link
- Record at 1920×1080, 30fps
- Speak slowly and clearly — pause 1 second after each click
- If a spinner appears, use it as a natural narration moment
- Trim dead air at the start/end before submitting
