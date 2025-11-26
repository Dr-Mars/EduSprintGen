# SPRINT 4: DEFENSES & EVALUATION - COMPREHENSIVE IMPLEMENTATION PLAN

## 📋 SPRINT 4 OVERVIEW

**Status:** Ready to implement (50% of project complete - sprints 1-3 done)  
**Estimated Duration:** 1-2 weeks  
**Key Features:** Defense scheduling, jury management, grading calculations, AI-powered feedback  
**Dependencies:** SPRINT 1-3 (Auth, Proposals, Reports complete)

---

## 🎯 SPRINT 4 REQUIREMENTS

### 1. DEFENSE SCHEDULING
**What:** Allow coordinators to schedule PFE defenses with date/time/room
**Why:** Organize defense sessions with jury availability checks
**Who:** Coordinator role schedules, Students/Jury view their schedule

**Data Model (Already in schema):**
```
Defenses:
- id (UUID)
- pfeProposalId (FK)
- scheduledAt (timestamp) - Date + time of defense
- duration (int) - 60 minutes default
- room (varchar) - Physical or virtual room location
- status (enum) - "scheduled", "completed", "cancelled"
- presentationScore, reportScore, companyScore (0-20 each)
- finalScore (calculated)
- mention (Excellent/Très Bien/Bien/Assez Bien/Passable/Fail)
- comments (text)
```

**Functional Requirements:**
- [x] Create defense with validation
- [x] Check room availability (no double-booking)
- [x] Check jury member availability (no conflicts)
- [x] Prevent past date scheduling
- [x] Update defense status (scheduled → completed → archived)
- [x] Cancel defense (mark as cancelled)

---

### 2. JURY COMPOSITION & CONFLICT OF INTEREST
**What:** Assign jury members with role validation and conflict checking
**Why:** Ensure fairness and expertise in student evaluation
**Who:** Coordinator assigns jury, Admin manages roster

**Data Model (Already in schema):**
```
JuryMembers:
- id (UUID)
- defenseId (FK)
- userId (FK) - Person evaluating
- role (enum) - "president", "rapporteur", "examiner", "supervisor"
- createdAt (timestamp)
```

**Functional Requirements:**
- [x] Add jury member with role assignment
- [x] **CONFLICT OF INTEREST CHECK:**
  - Student's academic supervisor CANNOT be rapporteur/examiner (can be supervisor role only)
  - Student's company supervisor CANNOT be rapporteur/examiner (can be supervisor role only)
  - Same person CANNOT have multiple roles in same defense
  - Prevent self-grading (user can't evaluate if they're supervisor)
- [x] Validate jury has required roles:
  - 1 President (leads defense)
  - 1 Rapporteur (submits detailed report)
  - 1+ Examiners (technical questions)
  - 2 Supervisors (academic + company)
- [x] Check workload: Jury member can't have >4 defenses in same week
- [x] Remove jury member
- [x] List jury members by defense

---

### 3. EVALUATION SCORING SYSTEM
**What:** Define scoring criteria and calculate final grades
**Why:** Standardize evaluation across all PFE defenses
**Who:** Jury members enter scores, System calculates results

**Scoring Components (Weighted Average):**
```
REPORT SCORE (0-20) - 30% weight
├─ Content quality: 0-8
├─ Technical depth: 0-8
└─ Plagiarism consideration: 0-4 (from Sprint 3 plagiarism score)

PRESENTATION SCORE (0-20) - 40% weight
├─ Clarity: 0-6
├─ Technical knowledge: 0-7
├─ Q&A handling: 0-7

COMPANY SCORE (0-20) - 30% weight
├─ Professional competency: 0-10
├─ Project contribution: 0-10

FINAL SCORE CALCULATION:
finalScore = (reportScore × 0.30 + presentationScore × 0.40 + companyScore × 0.30)

MENTION (Honor level):
- Excellent: finalScore ≥ 90 (16/20)
- Très Bien: 80 ≤ finalScore < 90 (14.4-16)
- Bien: 70 ≤ finalScore < 80 (12.6-14.4)
- Assez Bien: 60 ≤ finalScore < 70 (10.8-12.6)
- Passable: 50 ≤ finalScore < 60 (9-10.8)
- Fail: finalScore < 50 (<9)
```

**Data Model (Already in schema):**
```
Evaluations:
- id (UUID)
- defenseId (FK)
- juryMemberId (FK) - Which jury member is scoring
- criteriaName (varchar) - "clarity", "technical_depth", etc.
- score (int) - Points earned (0-maxScore)
- maxScore (int) - Maximum possible points for this criteria
- comments (text) - Jury feedback on this criteria
- createdAt (timestamp)
```

**Functional Requirements:**
- [x] Create evaluation criteria (pre-defined set)
- [x] Submit jury scores for each criteria
- [x] Prevent duplicate criteria from same jury member
- [x] Auto-calculate defense final scores:
  - Average all jury member scores per component
  - Calculate weighted final score
  - Assign mention based on range
- [x] Update defense with final scores and mention
- [x] Retrieve evaluation results for students/supervisors

---

### 4. EVALUATION FORMS & JURY INTERFACE
**What:** Frontend forms for jury to enter detailed scores
**Why:** Simple, intuitive scoring interface for evaluation session
**Who:** Jury members use during/after defense

**Functional Requirements:**
- [x] Display defense info (student, proposal, date, room)
- [x] Scoring grid with criteria and inputs
- [x] Comment fields for each criterion
- [x] Real-time score calculation preview
- [x] Submit scores with validation
- [x] View previously submitted scores
- [x] Export evaluation results

---

### 5. AI-POWERED FEEDBACK (Optional - requires GEMINI_API_KEY)
**What:** Generate constructive feedback using Gemini API
**Why:** Provide students with actionable insights for improvement
**Who:** System generates automatically after defense completion

**AI Feedback Generation:**
```
Input to Gemini:
- Student name & proposal title
- Report score & plagiarism score
- Presentation score breakdown
- Company score & comments
- Individual jury member comments
- All evaluation criteria and scores

Output from Gemini:
- Strengths summary (2-3 key positives)
- Areas for improvement (2-3 key weaknesses)
- Recommendations for future work
- Technical feedback on project
```

**Functional Requirements:**
- [x] Generate feedback after all jury members submit scores
- [x] Store generated feedback in evaluations
- [x] Display feedback to student
- [x] Include in results report

---

## 🛠️ IMPLEMENTATION BREAKDOWN

### PHASE 1: Backend Service Layer (2-3 days)

#### Task 1.1: Defense Service & Validation
**File:** `server/defense-service.ts` (NEW)

```typescript
class DefenseService {
  // Defense Creation & Scheduling
  async createDefense(pfeProposalId, scheduledAt, room) {
    // Validate proposal exists
    // Validate scheduledAt is future date
    // Check room available (no overlapping defenses in same room ±30min buffer)
    // Create defense
  }
  
  // Room Availability Check
  async isRoomAvailable(room, scheduledAt, duration) {
    // Query defenses with same room overlapping time window
    // Return availability status
  }
  
  // Get defenses for jury member (check availability)
  async getJuryMemberSchedule(userId, weekStart, weekEnd) {
    // Return all defenses where user is jury member in that week
  }
}
```

**Acceptance Criteria:**
- [x] Defenses created with valid dates (future only)
- [x] Room conflicts prevented
- [x] Database persists all defense data

---

#### Task 1.2: Jury Composition & Conflict Detection
**File:** `server/jury-service.ts` (NEW)

```typescript
class JuryService {
  // Add Jury Member with validation
  async addJuryMember(defenseId, userId, role) {
    // Get defense and proposal
    // Get proposal with supervisor info
    // CONFLICT CHECK:
    if (userId === proposal.academicSupervisorId && role !== 'supervisor')
      throw "Academic supervisor can only have supervisor role"
    if (userId === proposal.companySupervisorId && role !== 'supervisor')
      throw "Company supervisor can only have supervisor role"
    if (alreadyAssigned(defenseId, userId))
      throw "User already jury member"
    // WORKLOAD CHECK:
    const weekDefenses = await getJuryMemberSchedule(userId, thisWeek)
    if (weekDefenses.length >= 4)
      throw "Jury member exceeded weekly limit"
    // Add jury member
  }
  
  // Validate Jury Composition
  async validateJuryComposition(defenseId) {
    const juryMembers = await listJuryMembersByDefense(defenseId)
    // Check: 1 president
    // Check: 1 rapporteur
    // Check: 1+ examiner
    // Check: 2 supervisors (if company PFE)
    // Return validation status + errors
  }
  
  // Remove Jury Member
  async removeJuryMember(juryMemberId) {
    // Delete from database
    // Remove related evaluations
  }
}
```

**Acceptance Criteria:**
- [x] Conflict of interest prevented
- [x] Workload limits enforced
- [x] Jury composition validated
- [x] Clear error messages for violations

---

#### Task 1.3: Grading & Score Calculation
**File:** `server/grading-service.ts` (NEW)

```typescript
class GradingService {
  // Define Evaluation Criteria (Pre-set)
  EVALUATION_CRITERIA = {
    report: [
      { name: 'content_quality', maxScore: 8, description: 'Completeness and accuracy' },
      { name: 'technical_depth', maxScore: 8 },
      { name: 'plagiarism_penalty', maxScore: 4 }
    ],
    presentation: [
      { name: 'clarity', maxScore: 6 },
      { name: 'technical_knowledge', maxScore: 7 },
      { name: 'qa_handling', maxScore: 7 }
    ],
    company: [
      { name: 'professional_competency', maxScore: 10 },
      { name: 'project_contribution', maxScore: 10 }
    ]
  }
  
  // Submit Jury Evaluation
  async submitEvaluation(defenseId, juryMemberId, evaluations) {
    // evaluations: [{ criteriaName, score, comments }, ...]
    // Validate scores within max
    // Create evaluation records
    // Check if all jury members submitted
    // If yes, calculate final scores
  }
  
  // Calculate Defense Scores
  async calculateDefenseScores(defenseId) {
    const evaluations = await listEvaluationsByDefense(defenseId)
    
    // Group by jury member
    // Calculate component average:
    // reportScore = avg(all jury.report criteria)
    // presentationScore = avg(all jury.presentation criteria)
    // companyScore = avg(all jury.company criteria)
    
    // Weighted final score:
    const finalScore = (
      (reportScore * 20 / MAX_REPORT) * 0.30 +
      (presentationScore * 20 / MAX_PRESENTATION) * 0.40 +
      (companyScore * 20 / MAX_COMPANY) * 0.30
    )
    
    const mention = this.getMention(finalScore)
    
    // Update defense with scores + mention
    await updateDefense(defenseId, {
      reportScore,
      presentationScore,
      companyScore,
      finalScore,
      mention,
      status: 'completed'
    })
  }
  
  // Determine Mention
  getMention(finalScore) {
    if (finalScore >= 16) return 'Excellent'
    if (finalScore >= 14.4) return 'Très Bien'
    if (finalScore >= 12.6) return 'Bien'
    if (finalScore >= 10.8) return 'Assez Bien'
    if (finalScore >= 9) return 'Passable'
    return 'Fail'
  }
}
```

**Acceptance Criteria:**
- [x] Criteria pre-defined and immutable
- [x] Scores calculated correctly with weights
- [x] Mention assigned based on score ranges
- [x] Math validated (manual spot checks)

---

#### Task 1.4: AI Feedback Service (Optional)
**File:** `server/gemini-feedback-service.ts` (NEW)

```typescript
class GeminiFeedbackService {
  async generateEvaluationFeedback(defenseId) {
    // Fetch defense + proposal + all evaluations
    const defense = await getDefense(defenseId)
    const proposal = await getPfeProposal(defense.pfeProposalId)
    const allEvaluations = await listEvaluationsByDefense(defenseId)
    
    // Build prompt
    const prompt = `
      Provide constructive feedback for student's PFE defense:
      Student: ${student.firstName} ${student.lastName}
      Project: ${proposal.title}
      
      Scores:
      - Report: ${defense.reportScore}/20 (Plagiarism: ${report.plagiarismScore}%)
      - Presentation: ${defense.presentationScore}/20
      - Company Work: ${defense.companyScore}/20
      
      Jury Comments: ${evaluations.map(e => e.comments).join('; ')}
      
      Generate:
      1. Strengths (2-3 key positives)
      2. Areas for improvement (2-3 weaknesses)
      3. Recommendations for future work
      Keep it actionable and motivating.
    `
    
    const feedback = await geminiClient.generateContent(prompt)
    
    // Store feedback
    await storage.createEvaluation({
      defenseId,
      juryMemberId: 'SYSTEM',
      criteriaName: 'ai_feedback',
      score: null,
      maxScore: null,
      comments: feedback.text
    })
    
    return feedback.text
  }
}
```

**Acceptance Criteria:**
- [x] Only runs if GEMINI_API_KEY set
- [x] Generates meaningful, personalized feedback
- [x] Gracefully skips if API fails
- [x] Stored in database for retrieval

---

### PHASE 2: Backend APIs (1-2 days)

**File:** `server/routes.ts` (UPDATE existing defense routes + ADD new)

#### New Endpoints:

```
1. DEFENSE SCHEDULING
POST   /api/defenses                    - Create defense
GET    /api/defenses                    - List (with filters: status, userId)
GET    /api/defenses/:id                - Get single defense
PATCH  /api/defenses/:id                - Update defense (reschedule, cancel)
DELETE /api/defenses/:id                - Cancel defense

2. JURY COMPOSITION
POST   /api/defenses/:id/jury           - Add jury member
GET    /api/defenses/:id/jury           - List jury members
DELETE /api/jury-members/:id            - Remove jury member
PATCH  /api/jury-members/:id            - Update jury member role (if needed)

3. EVALUATION & GRADING
POST   /api/evaluations                 - Submit evaluation scores
GET    /api/defenses/:id/evaluations    - Get all evaluations for defense
GET    /api/defenses/:id/results        - Get calculated results
GET    /api/students/:id/results        - Get student's all results

4. ROOM AVAILABILITY (Helper)
GET    /api/defenses/rooms/available    - Check room availability for time slot

5. AI FEEDBACK (Optional)
POST   /api/defenses/:id/generate-feedback  - Trigger feedback generation
GET    /api/defenses/:id/feedback           - Retrieve generated feedback
```

#### Implementation Guidelines:

```typescript
// POST /api/defenses - Create Defense
app.post("/api/defenses", authMiddleware, roleMiddleware(['coordinator']), async (req, res) => {
  // Parse & validate request body
  const { pfeProposalId, scheduledAt, duration, room } = req.body
  // Validate: proposal exists, date is future, room available
  // Create defense
  // Return created defense
})

// POST /api/defenses/:id/jury - Add Jury Member
app.post("/api/defenses/:id/jury", authMiddleware, roleMiddleware(['coordinator']), async (req, res) => {
  // Parse & validate { userId, role }
  // Call juryService.addJuryMember() - handles all validation
  // If error, return 400 with clear message
  // Return added jury member
})

// POST /api/evaluations - Submit Scores
app.post("/api/evaluations", authMiddleware, roleMiddleware(['jury']), async (req, res) => {
  // Parse & validate { defenseId, evaluations: [{criteriaName, score, comments}, ...] }
  // Create evaluation records
  // Check if defense is complete (all jury members submitted)
  // If complete, call gradingService.calculateDefenseScores()
  // If GEMINI_API_KEY set, call geminiFeedbackService.generateEvaluationFeedback()
  // Return submission confirmation
})

// GET /api/defenses/:id/results - Get Results
app.get("/api/defenses/:id/results", authMiddleware, async (req, res) => {
  // Get defense with all related data
  // Get all evaluations
  // Return computed results: scores, mention, feedback
})
```

**Acceptance Criteria:**
- [x] All endpoints return proper HTTP status codes
- [x] Validation errors return 400 with message
- [x] Auth checks prevent unauthorized access
- [x] Role-based access control enforced

---

### PHASE 3: Frontend Pages (2-3 days)

#### Task 3.1: Defense Scheduling Calendar
**File:** `client/src/pages/defense-scheduling.tsx` (NEW for Coordinator)

```typescript
Features:
- Calendar view (weekly/monthly)
- Create defense button → modal with:
  - Proposal selector (dropdown)
  - Date/time picker (disable past dates)
  - Duration input (default 60min)
  - Room input (with availability check dropdown)
  - Submit button
- Display scheduled defenses
- Reschedule defense (edit modal)
- Cancel defense (confirmation)
```

**Data Flow:**
```
User selects proposal
→ Fetch proposal data
→ Date/time selector
→ Check room availability (API call)
→ Submit POST /api/defenses
→ Refresh calendar view
```

---

#### Task 3.2: Jury Composition Manager
**File:** `client/src/pages/jury-management.tsx` (NEW for Coordinator)

```typescript
Features:
- Select defense from list
- Display assigned jury members (table/cards)
- Add jury member modal:
  - User dropdown (list of academics/supervisors)
  - Role dropdown (president/rapporteur/examiner/supervisor)
  - Validate conflicts on submit
  - Show error if conflict detected
- Remove jury member button
- Display jury composition validation status:
  - ✓ President assigned
  - ✓ Rapporteur assigned
  - ✓ 1+ Examiners assigned
  - ✓ Supervisors assigned
- Color-code missing roles (red) vs complete (green)
```

**Data Flow:**
```
Select defense
→ Fetch jury members (GET /api/defenses/:id/jury)
→ Click "Add Jury"
→ Select user + role
→ Submit POST /api/defenses/:id/jury
→ Handle error (show conflict message)
→ Or refresh jury list on success
```

---

#### Task 3.3: Evaluation Scoring Form
**File:** `client/src/pages/defense-evaluation.tsx` (NEW for Jury Members)

```typescript
Features:
- Defense info header (student, proposal, date, room)
- Scoring form with three sections:

SECTION 1: REPORT EVALUATION (0-20 max)
├─ Content Quality (0-8)
│  ├─ Input slider or number field
│  └─ Comment text area
├─ Technical Depth (0-8)
│  ├─ Input slider or number field
│  └─ Comment text area
├─ Plagiarism Consideration (0-4)
│  ├─ Show plagiarism score from Sprint 3
│  ├─ Auto-calculate penalty (or manual override)
│  └─ Comment text area

SECTION 2: PRESENTATION EVALUATION (0-20 max)
├─ Clarity (0-6)
├─ Technical Knowledge (0-7)
├─ Q&A Handling (0-7)
Each with input + comment

SECTION 3: COMPANY EVALUATION (0-20 max)
├─ Professional Competency (0-10)
├─ Project Contribution (0-10)

FOOTER:
- Real-time preview: Total scores + weighted calculation + mention
- Submit button (validate all fields filled)
- Cancel button
- Show "Submitted" status if already submitted
```

**Data Flow:**
```
Get defense ID (URL param)
→ Fetch defense + proposal + plagiarism score
→ Display form pre-filled if scores exist
→ User enters scores + comments
→ Show live calculation preview
→ Submit POST /api/evaluations
→ Show confirmation
→ Redirect to defenses list
```

**UI Components:**
```
<DefenseHeader> - Student name, proposal title, date, room
<ScoringSection> - One per component (report/presentation/company)
  └─ <CriteriaRow> - Each criterion with slider + input + comment
<ScorePreview> - Shows totals + weighted + mention
<SubmitButton> - Validate + POST
```

---

#### Task 3.4: Defense Results Page
**File:** `client/src/pages/defense-results.tsx` (NEW for Students/Supervisors)

```typescript
Features:
- Defense info (date, room, status)
- Final scores display:
  - Report Score: 16/20
  - Presentation Score: 18/20
  - Company Score: 17/20
  - FINAL: 17.1/20 = Très Bien
  - Visual: Progress bars or score cards with color coding
    * Green: >90
    * Blue: 80-90
    * Orange: 70-80
    * Yellow: 60-70
    * Red: <60
- Jury feedback (if AI-generated):
  - Strengths section
  - Areas for improvement
  - Recommendations
- Individual jury member comments:
  - List of comments by jury member (optional - depends on privacy needs)
- Download results as PDF (optional)
```

**Data Flow:**
```
Get defense ID
→ Fetch defense with results
→ If AI feedback exists, show it
→ Fetch evaluations for jury comments
→ Display formatted results
```

---

#### Task 3.5: Jury Schedule Page
**File:** `client/src/pages/jury-schedule.tsx` (UPDATE existing or create NEW)

```typescript
Features:
- My defenses list (where current user is jury member)
- Columns: Proposal Title | Student | Date | Room | Status | Action
- Filter by status (scheduled/completed)
- Sort by date
- Links to:
  - View defense details
  - Go to evaluation form (if scheduled & not completed)
  - View results (if completed)
- Calendar view (optional)
```

---

### PHASE 4: Integration & Testing (1-2 days)

#### Testing Checklist:

```
✓ Defense Scheduling:
  - Create defense with future date → SUCCESS
  - Create defense with past date → 400 ERROR
  - Create defense with same room + overlapping time → 400 ERROR
  - Two coordinators create same room different time → SUCCESS
  
✓ Jury Composition:
  - Add academic supervisor as rapporteur → 400 ERROR
  - Add academic supervisor as supervisor → SUCCESS
  - Add same user twice → 400 ERROR
  - Add jury member to full team → SUCCESS
  - Add 5th person in same week → 400 ERROR
  - Validate jury completion → Shows missing roles
  
✓ Evaluation Scoring:
  - Submit incomplete form → Validation error
  - Submit with scores > max → 400 ERROR
  - Submit valid form → Created, stored, retrievable
  - Auto-calculate final score correctly → Math verified
  - Generate AI feedback (if GEMINI_API_KEY) → Stored + retrievable
  
✓ Results Display:
  - Student sees own results → SUCCESS
  - Student can't see other results → 403 FORBIDDEN
  - Supervisor sees assigned student results → SUCCESS
  - Coordinator sees all results → SUCCESS
  
✓ Role-Based Access:
  - Only coordinator can create defense → Others get 403
  - Only jury can submit evaluations → Others get 403
  - Only student/supervisor can view own results → Others get 403
```

---

## 📊 SPRINT 4 METRICS

| Component | Lines of Code | Complexity | Test Coverage |
|-----------|---|---|---|
| Defense Service | 200 | Medium | Unit tests |
| Jury Service | 250 | High | Unit + integration |
| Grading Service | 150 | Medium | Unit tests |
| AI Feedback Service | 100 | Low | Integration |
| Backend Routes | 400 | High | Integration |
| Frontend (4 pages) | 1200 | High | E2E + component |
| **TOTAL** | **~2300** | **Medium-High** | **85%+** |

---

## 🔧 TECH STACK FOR SPRINT 4

**Backend:**
- Express.js (existing)
- Drizzle ORM (existing)
- TypeScript (existing)
- Google Generative AI (gemini for feedback)

**Frontend:**
- React (existing)
- React Query (existing)
- Shadcn components (existing)
- React Calendar library (date picking): `react-day-picker` (already installed)

**Database:**
- PostgreSQL (existing)
- Defenses table (ready)
- JuryMembers table (ready)
- Evaluations table (ready)

---

## 📦 DEPENDENCIES NEEDED

**No new npm packages required!** ✓

All needed libraries already installed:
- `@tanstack/react-query` - Data fetching
- `@hookform/resolvers` - Form validation
- `react-hook-form` - Form management
- `zod` - Schema validation
- `@google/genai` - Gemini API (if using AI feedback)
- `lucide-react` - Icons
- Shadcn components - UI

---

## 🚨 RISK MITIGATION

| Risk | Probability | Mitigation |
|------|---|---|
| Jury conflict logic bugs | HIGH | Unit test extensively, manual testing |
| Score calculation math errors | HIGH | Document formula, verify with hand calculations |
| AI feedback API limits/cost | MEDIUM | Set budget limits, cache responses, make optional |
| Double-booking edge cases | MEDIUM | Test timezone issues, add buffer between defenses |
| Performance with large evaluations | LOW | Add indexes on defenseId, userId |

---

## ✅ ACCEPTANCE CRITERIA FOR SPRINT 4

**MUST HAVE:**
- [x] Defense scheduling with room availability checks
- [x] Jury composition with conflict of interest prevention
- [x] Evaluation form with criterion-based scoring
- [x] Automatic final score calculation with mention
- [x] Results display for students/supervisors
- [x] All role-based access controls enforced

**NICE TO HAVE:**
- [ ] AI-powered feedback generation (if GEMINI_API_KEY available)
- [ ] Calendar visualization
- [ ] PDF export of results
- [ ] Email notifications

---

## 🗓️ IMPLEMENTATION TIMELINE

**Day 1:** Backend services (Defense + Jury + Grading)  
**Day 2:** Backend routes + API testing  
**Day 3:** Frontend pages (scheduling + jury management)  
**Day 4:** Frontend pages (evaluation form + results)  
**Day 5:** Integration testing + bug fixes  
**Day 6:** AI feedback service (if doing)  
**Day 7:** Final QA + documentation

---

## 📝 NEXT STEPS

1. **Review this plan** with the user
2. **Get approval** on approach
3. **Request GEMINI_API_KEY** if AI feedback is wanted
4. **Begin Phase 1** - Backend services
5. **Track progress** with task list updates

---

## 🎯 SUCCESS CRITERIA

At end of SPRINT 4:
- ✓ Coordinators can schedule defenses with validations
- ✓ Jury members can be assigned with conflict checking
- ✓ Jury can submit scores via simple form
- ✓ Final scores auto-calculate with mentions
- ✓ Students see their results
- ✓ All E2E tests pass
- ✓ Project reaches 62.5% completion (5/8 sprints)

---
