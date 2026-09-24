# ARCHITECTURE BASELINE — PHASE 1: QC ISSUE IDENTITY & AUDIT TRAIL
**Document Version:** 1.0.0 (LOCKED)  
**Status:** LOCKED & VERIFIED  
**Lock Date:** 2026-09-24  
**Applet ID:** 7d5c9bc3-917f-48b0-8741-8c9a5fbe5ef3  

---

## 1. PURPOSE & PRINCIPLES
This baseline establishes an immutable, auditable, and deterministic Quality Control (QC) foundation for the Digital Lecturer Engine.
Key architectural invariants:
- **No Sequential ID Counters**: Issue identities are never assigned via ephemeral iteration indices (`QC-001`, `QC-002`).
- **Semantic Determinism**: An issue's identity is strictly derived from its semantic defect category, target domain, and sub-target coordinates.
- **Permanent Audit Trail**: Lecturer resolutions, waivers, and issue lifecycle histories are never erased or overwritten.
- **Reconciliation Over Mutation**: Successive audit runs reconcile against historical issue registries rather than re-creating issues from scratch.

---

## 2. CORE SCHEMAS & IMPLEMENTATION

### 2.1 Issue Lifecycle (`QCIssueStatus`)
```typescript
export type QCIssueStatus =
  | 'ACTIVE'                     // Defect currently present, unaddressed
  | 'RESOLVED'                   // Signed-off with corrective/instructional action
  | 'WAIVED'                     // Formally accepted by lecturer as valid variance
  | 'REOPENED'                   // Defect previously resolved or disappeared has recurred
  | 'DISAPPEARED'                // Underlying source defect resolved in input, retained in history
  | 'RESOLVED_BY_SOURCE_CHANGE'; // Explicit source-level modification resolved defect
```

### 2.2 Lecturer Resolution Record (`ResolutionRecord`)
```typescript
export interface ResolutionRecord {
  id: string;                   // Unique record ID (e.g., RES-muevlo1v-X0NE)
  issueId: string;              // Deterministic human-readable issue ID
  issueKey: string;             // Canonical semantic composite key
  auditRunId: string;           // QC execution run when resolution occurred
  issueType: QCCategory;        // Target QC rule category
  severity: QCSeverity;         // CRITICAL | WARNING | INFO
  lecturerDecision: 'RESOLVED' | 'WAIVED' | 'ACKNOWLEDGED' | 'EXCLUDED';
  lecturerNote: string;         // Mandatory academic justification
  resolvedAt: string;           // ISO 8601 UTC timestamp
  resolvedBy: string;           // Lecturer name/credential
  affectedSource?: string;      // Related document reference
  affectedSlide?: number | string; // Related slide index
  affectedTeachingBlock?: string;  // Related teaching block ID
}
```

### 2.3 Upgraded QC Issue Schema (`QCIssue`)
```typescript
export interface QCIssue {
  id: string;                   // Deterministic ID: QC-{category}-{targetId}[-{subTargetId}]
  issueKey: string;             // Composite Key: {category}|{targetType}|{targetId}[|{subTargetId}]
  category: QCCategory;
  severity: QCSeverity;
  title: string;
  description: string;
  targetId?: string;
  targetType?: 'BLOCK' | 'SLIDE' | 'SOURCE' | 'PACKAGE' | 'OBJECTIVE';
  subTargetId?: string;
  suggestedAction?: string;
  status: QCIssueStatus;
  resolved: boolean;
  resolvedByLecturer?: boolean;
  lecturerComment?: string;
  firstDetectedAt: string;
  firstDetectedRunId: string;
  lastDetectedAt: string;
  lastDetectedRunId: string;
  detectionCount: number;
  resolutionHistory: ResolutionRecord[];
  legacyId?: string;            // Backward-compatibility bridge
  evidence?: { ... };
}
```

---

## 3. IDENTITY GENERATION ALGORITHMS

### 3.1 Stable Semantic Composite Key (`issueKey`)
```typescript
issueKey = `${category}|${targetType}|${targetId}${subTargetId ? `|${subTargetId}` : ''}`
```
- Completely invariant to check order, array mutations, and description wording updates.

### 3.2 Stable Human-Readable Issue ID (`id`)
```typescript
const cleanTarget = String(targetId).replace(/[^a-zA-Z0-9_-]/g, '_');
const cleanSubTarget = subTargetId ? `-${String(subTargetId).replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
id = `QC-${category}-${cleanTarget}${cleanSubTarget}`;
```

### 3.3 Audit Run Identity (`auditRunId`)
```typescript
auditRunId = `RUN-${timestamp}-${randomSuffix}`;
```
- Rotates on every discrete audit execution. Scopes execution results without mutating underlying issue identities.

---

## 4. LIFECYCLE & RE-AUDIT BEHAVIOR

1. **First-time Defect Detection**:
   - `status = 'ACTIVE'`, `detectionCount = 1`, `firstDetectedRunId = currentRunId`, `lastDetectedRunId = currentRunId`.
2. **Defect Persists Across Re-audits (Unresolved)**:
   - `status` remains `'ACTIVE'`.
   - `detectionCount` increments by 1.
   - `lastDetectedRunId = currentRunId`, `lastDetectedAt = now`.
   - `id`, `issueKey`, `firstDetectedRunId`, and `firstDetectedAt` remain invariant.
3. **Defect Persists but Already Resolved/Waived**:
   - `status` remains `'RESOLVED'` or `'WAIVED'`.
   - `resolved = true`, `resolvedByLecturer = true`.
   - `resolutionHistory` is preserved intact.
   - `lastDetectedRunId = currentRunId`, `lastDetectedAt = now`.
4. **Defect Disappears in Source (e.g., Slide Mapped or Content Fixed)**:
   - Existing issue is **NOT deleted**.
   - `status = 'DISAPPEARED'`, `resolved = true`.
   - Retained in audit registry for complete governance history.
5. **Defect Returns After Disappearance or Invalidation**:
   - Existing issue is transitioned to `status = 'REOPENED'`.
   - `resolved = false`.
   - Retains the exact same `id` and `issueKey`. No duplicate issue is created.

---

## 5. SCOPING & PERSISTENCE BEHAVIOR

- **Scope Boundary**: Issue registry is scoped at the aggregate root level of `LecturePackage`. Each `LecturePackage` owns its audit history.
- **Persistence Guarantee**: Serializing `LecturePackage` to JSON and restoring upon server reload preserves:
  - All `issueId`, `issueKey`, `status`, and `resolutionHistory` records.
  - `firstDetectedRunId`, `firstDetectedAt`, and detection counters.
  - Re-auditing a restored package properly updates `lastDetectedRunId` and preserves resolved statuses.
- **Package Isolation**: Modifications or resolutions to issues in Package A have zero cross-contamination effect on identical issues in Package B.

---

## 6. APPROVAL GATE BEHAVIOR

1. **Gate Rule**:
   - Package approval is strictly blocked if any issue with `severity === 'CRITICAL'` has `status === 'ACTIVE' || status === 'REOPENED'`.
2. **Gate Unlock Conditions**:
   - Critical issues must transition to `RESOLVED` or `WAIVED` through a signed `ResolutionRecord` submitted by an authorized lecturer.
   - In `/api/lecture/approve`, the gate enforces:
     ```typescript
     if (qc.criticalCount > 0) {
       return res.status(400).json({
         error: `Không thể phê duyệt: Còn ${qc.criticalCount} vấn đề CRITICAL chưa được giảng viên giải quyết.`,
         issues: qc.issues.filter(i => i.severity === 'CRITICAL' && (i.status === 'ACTIVE' || i.status === 'REOPENED'))
       });
     }
     ```

---

## 7. BACKWARD COMPATIBILITY
- Legacy lookups (`QC-001`, `QC-002`) remain supported via `legacyId` and dual-resolution fallbacks in `/api/lecture/resolve-issue` (`issueId || issueKey || legacyId`).
- Old clients submitting resolution actions without `issueKey` resolve correctly against active or registered issue IDs.

---

## 8. AUTOMATED VERIFICATION SUITE
Automated stability suite (`/scripts/runQCTests.ts`, `/src/services/qualityControl/__tests__/qcStabilityTests.ts`) covers all 7 mandatory criteria with 100% pass rate:
- Test 1: Run QC twice -> identical issue identities & unique auditRunIds.
- Test 2: Resolve one issue -> remaining issue identities unchanged (no renumbering).
- Test 3: Resolve issue and re-run QC -> lecturer resolution permanently attached.
- Test 4: Fix source -> issue preserved in audit history marked DISAPPEARED.
- Test 5: Reintroduce defect -> same issue identity REOPENED (no duplicates).
- Test 6: Change only wording of description -> issue identity unchanged.
- Test 7: Change check/slide order -> issue identities unchanged.
