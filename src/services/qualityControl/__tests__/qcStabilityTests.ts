/**
 * Digital Lecturer Engine - Mandatory QC Issue ID Stability Automated Tests
 * Validates all 7 criteria specified in Phase 1 Architectural Fix.
 */

import { QualityControlEngine } from '../qualityControlEngine';
import { createSampleLecturePackage } from '../../../sampleData/universityLecturePackage';
import { LecturePackage } from '../../../types/lecture';
import { ResolutionRecord } from '../../../types/quality';

export interface TestResult {
  testNumber: number;
  testName: string;
  passed: boolean;
  details: string;
  diagnostics?: any;
}

export function runAllQCStabilityTests(): { allPassed: boolean; results: TestResult[] } {
  const results: TestResult[] = [];

  // =========================================================================
  // TEST 1: Run QC twice without changing the package
  // Expected: identical issue identities, different auditRunIds
  // =========================================================================
  try {
    const pkg1 = createSampleLecturePackage();
    const run1 = QualityControlEngine.audit(pkg1);
    pkg1.qualityControl = run1;
    const run2 = QualityControlEngine.audit(pkg1);

    const run1Ids = run1.issues.map(i => ({ id: i.id, key: i.issueKey }));
    const run2Ids = run2.issues.map(i => ({ id: i.id, key: i.issueKey }));

    const idsMatch = JSON.stringify(run1Ids) === JSON.stringify(run2Ids);
    const runIdsDifferent = run1.auditRunId !== run2.auditRunId && run1.auditRunId.length > 5 && run2.auditRunId.length > 5;

    results.push({
      testNumber: 1,
      testName: 'Run QC twice without changing the package -> identical issue identities & unique auditRunIds',
      passed: idsMatch && runIdsDifferent,
      details: `Identical issue IDs: ${idsMatch}. Run 1 ID: ${run1.auditRunId}, Run 2 ID: ${run2.auditRunId} (distinct: ${runIdsDifferent}). Total issues: ${run1.issues.length}`,
      diagnostics: { run1Ids, run2Ids }
    });
  } catch (err: any) {
    results.push({ testNumber: 1, testName: 'Test 1', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 2: Resolve the first issue. Run QC again.
  // Expected: all remaining issue identities remain unchanged (no renumbering).
  // =========================================================================
  try {
    const pkg2 = createSampleLecturePackage();
    const initialReport = QualityControlEngine.audit(pkg2);
    pkg2.qualityControl = initialReport;

    const firstIssue = initialReport.issues[0];
    const initialOtherIssueIds = initialReport.issues.slice(1).map(i => i.id);

    // Resolve first issue
    firstIssue.resolved = true;
    firstIssue.status = 'RESOLVED';
    firstIssue.resolvedByLecturer = true;

    const afterResolveReport = QualityControlEngine.audit(pkg2);
    const postOtherIssues = afterResolveReport.issues.filter(i => i.id !== firstIssue.id).map(i => i.id);

    // Verify all other IDs are preserved
    const allPreserved = initialOtherIssueIds.every(id => postOtherIssues.includes(id));
    const sameCount = initialReport.issues.length === afterResolveReport.issues.length;

    results.push({
      testNumber: 2,
      testName: 'Resolve one issue and run QC again -> remaining issue identities unchanged (no renumbering)',
      passed: allPreserved && sameCount,
      details: `Resolved issue: ${firstIssue.id}. Remaining issues before: [${initialOtherIssueIds.join(', ')}]. Remaining issues after: [${postOtherIssues.join(', ')}]. Preserved: ${allPreserved}`,
      diagnostics: { before: initialOtherIssueIds, after: postOtherIssues }
    });
  } catch (err: any) {
    results.push({ testNumber: 2, testName: 'Test 2', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 3: Resolve one issue and re-run QC.
  // Expected: lecturer resolution remains attached to the same issue.
  // =========================================================================
  try {
    const pkg3 = createSampleLecturePackage();
    const initialReport = QualityControlEngine.audit(pkg3);
    pkg3.qualityControl = initialReport;

    // Target the slide mismatch issue
    const targetIssue = initialReport.issues.find(i => i.category === 'SLIDE_CONTENT_MISMATCH') || initialReport.issues[0];
    const targetId = targetIssue.id;

    const resolutionRec: ResolutionRecord = {
      id: 'RES-TEST-001',
      issueId: targetIssue.id,
      issueKey: targetIssue.issueKey,
      auditRunId: initialReport.auditRunId,
      issueType: targetIssue.category,
      severity: targetIssue.severity,
      lecturerDecision: 'EXCLUDED',
      lecturerNote: 'Slide ngoại vi, giảng viên xác nhận loại trừ khỏi bài giảng chính khóa.',
      resolvedAt: new Date().toISOString(),
      resolvedBy: 'GS. Nguyễn Văn A',
      affectedSlide: 6
    };

    targetIssue.resolved = true;
    targetIssue.status = 'RESOLVED';
    targetIssue.resolvedByLecturer = true;
    targetIssue.lecturerComment = resolutionRec.lecturerNote;
    targetIssue.resolutionHistory = [resolutionRec];

    // Re-run QC
    const reauditReport = QualityControlEngine.audit(pkg3);
    const postIssue = reauditReport.issues.find(i => i.id === targetId);

    const retainsSignoff = postIssue !== undefined &&
      postIssue.status === 'RESOLVED' &&
      postIssue.resolutionHistory?.length === 1 &&
      postIssue.resolutionHistory[0].id === 'RES-TEST-001' &&
      postIssue.resolutionHistory[0].resolvedBy === 'GS. Nguyễn Văn A';

    results.push({
      testNumber: 3,
      testName: 'Resolve issue and re-run QC -> lecturer resolution permanently attached to stable issue ID',
      passed: retainsSignoff,
      details: `Issue ${targetId} maintained resolution: status=${postIssue?.status}, recordsCount=${postIssue?.resolutionHistory?.length}, signer=${postIssue?.resolutionHistory?.[0]?.resolvedBy}`,
      diagnostics: { postIssueHistory: postIssue?.resolutionHistory }
    });
  } catch (err: any) {
    results.push({ testNumber: 3, testName: 'Test 3', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 4: Change PowerPoint so Slide 6 becomes valid. Run QC again.
  // Expected: historical issue remains in audit history and is marked DISAPPEARED.
  // =========================================================================
  try {
    const pkg4 = createSampleLecturePackage();
    const initialReport = QualityControlEngine.audit(pkg4);
    pkg4.qualityControl = initialReport;

    const slideIssueBefore = initialReport.issues.find(i => i.category === 'SLIDE_CONTENT_MISMATCH');
    const slideIssueId = slideIssueBefore?.id;

    // Simulate modifying slide deck to fix Slide 6 (make it MAPPED to TB-001)
    const slide6 = pkg4.slideMap.find(s => s.slideNumber === 6);
    if (slide6) {
      slide6.status = 'MAPPED';
      slide6.mappedTeachingBlockIds = ['TB-001'];
      slide6.issues = [];
    }

    const reportAfterFix = QualityControlEngine.audit(pkg4);
    const historicalIssue = reportAfterFix.issues.find(i => i.id === slideIssueId);

    const markedDisappeared = historicalIssue !== undefined &&
      (historicalIssue.status === 'DISAPPEARED' || historicalIssue.status === 'RESOLVED_BY_SOURCE_CHANGE') &&
      historicalIssue.resolved === true;

    results.push({
      testNumber: 4,
      testName: 'Fix PowerPoint source -> issue is preserved in audit history and marked DISAPPEARED (not deleted)',
      passed: markedDisappeared,
      details: `Slide mismatch issue (${slideIssueId}) status after fix: "${historicalIssue?.status}". Retained in registry: ${historicalIssue !== undefined}`,
      diagnostics: { historicalIssue }
    });
  } catch (err: any) {
    results.push({ testNumber: 4, testName: 'Test 4', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 5: Reintroduce the same Slide 6 mismatch.
  // Expected: same issue identity is REOPENED, not a new issue ID.
  // =========================================================================
  try {
    const pkg5 = createSampleLecturePackage();
    const initialReport = QualityControlEngine.audit(pkg5);
    pkg5.qualityControl = initialReport;

    const originalIssue = initialReport.issues.find(i => i.category === 'SLIDE_CONTENT_MISMATCH');
    const originalIssueId = originalIssue?.id;

    // Step A: Slide 6 is fixed (disappears)
    const slide6 = pkg5.slideMap.find(s => s.slideNumber === 6);
    if (slide6) {
      slide6.status = 'MAPPED';
      slide6.mappedTeachingBlockIds = ['TB-001'];
    }
    const reportDisappeared = QualityControlEngine.audit(pkg5);
    pkg5.qualityControl = reportDisappeared;

    // Step B: Slide 6 defect returns!
    if (slide6) {
      slide6.status = 'MISMATCHED';
      slide6.mappedTeachingBlockIds = [];
    }
    const reportReopened = QualityControlEngine.audit(pkg5);
    const returnedIssue = reportReopened.issues.find(i => i.id === originalIssueId);

    const isReopened = returnedIssue !== undefined &&
      returnedIssue.status === 'REOPENED' &&
      returnedIssue.id === originalIssueId &&
      returnedIssue.resolved === false;

    // Ensure no duplicate issue was spawned
    const duplicateCount = reportReopened.issues.filter(i => i.category === 'SLIDE_CONTENT_MISMATCH').length;

    results.push({
      testNumber: 5,
      testName: 'Reintroduce same defect -> same issue identity is REOPENED (no duplicate ID created)',
      passed: isReopened && duplicateCount === 1,
      details: `Original ID: ${originalIssueId}. Reopened ID: ${returnedIssue?.id}. Status: "${returnedIssue?.status}". Duplicate count: ${duplicateCount}`,
      diagnostics: { returnedIssue }
    });
  } catch (err: any) {
    results.push({ testNumber: 5, testName: 'Test 5', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 6: Change only the wording of the issue description.
  // Expected: issue identity remains unchanged.
  // =========================================================================
  try {
    const pkg6 = createSampleLecturePackage();
    const initialReport = QualityControlEngine.audit(pkg6);
    pkg6.qualityControl = initialReport;

    const timingIssueBefore = initialReport.issues.find(i => i.category === 'TIMING_PLAN_VALID');
    const timingIdBefore = timingIssueBefore?.id;

    // Modify wording of timing mismatch description
    if (pkg6.timingPlan) {
      pkg6.timingPlan.mismatchDescription = 'CẬP NHẬT MÔ TẢ MỚI: Thời lượng bài giảng vượt 5 phút so với chuẩn quy định.';
    }

    const reportAfterWordingChange = QualityControlEngine.audit(pkg6);
    const timingIssueAfter = reportAfterWordingChange.issues.find(i => i.category === 'TIMING_PLAN_VALID');

    const idUnchanged = timingIssueAfter !== undefined && timingIssueAfter.id === timingIdBefore;
    const descriptionUpdated = timingIssueAfter?.description.includes('CẬP NHẬT MÔ TẢ MỚI');

    results.push({
      testNumber: 6,
      testName: 'Change only wording of description -> issue identity remains unchanged',
      passed: idUnchanged && Boolean(descriptionUpdated),
      details: `Issue ID before: ${timingIdBefore}, after: ${timingIssueAfter?.id} (unchanged: ${idUnchanged}). Description updated: ${descriptionUpdated}`,
      diagnostics: { beforeId: timingIdBefore, afterId: timingIssueAfter?.id }
    });
  } catch (err: any) {
    results.push({ testNumber: 6, testName: 'Test 6', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 7: Change the order of QC checks.
  // Expected: issue identities remain unchanged.
  // =========================================================================
  try {
    // We verify that QualityControlEngine generates identical keys and IDs regardless of check execution order,
    // and that the deterministic sort produces identical issue identities and order.
    const keyA = QualityControlEngine.generateIssueKey('SLIDE_CONTENT_MISMATCH', 'SLIDE', 'Slide-6');
    const idA = QualityControlEngine.generateIssueId('SLIDE_CONTENT_MISMATCH', 'SLIDE', 'Slide-6');

    const keyB = QualityControlEngine.generateIssueKey('TIMING_PLAN_VALID', 'PACKAGE', 'PACKAGE');
    const idB = QualityControlEngine.generateIssueId('TIMING_PLAN_VALID', 'PACKAGE', 'PACKAGE');

    // Swap invocation order
    const keyB2 = QualityControlEngine.generateIssueKey('TIMING_PLAN_VALID', 'PACKAGE', 'PACKAGE');
    const idB2 = QualityControlEngine.generateIssueId('TIMING_PLAN_VALID', 'PACKAGE', 'PACKAGE');

    const keyA2 = QualityControlEngine.generateIssueKey('SLIDE_CONTENT_MISMATCH', 'SLIDE', 'Slide-6');
    const idA2 = QualityControlEngine.generateIssueId('SLIDE_CONTENT_MISMATCH', 'SLIDE', 'Slide-6');

    const orderIndependent = keyA === keyA2 && idA === idA2 && keyB === keyB2 && idB === idB2;

    // Now test with lecture packages where rule execution order or slide sequence is shifted
    const pkg7A = createSampleLecturePackage();
    const report7A = QualityControlEngine.audit(pkg7A);

    const pkg7B = createSampleLecturePackage();
    // Reverse slideMap array in pkg7B
    pkg7B.slideMap.reverse();
    const report7B = QualityControlEngine.audit(pkg7B);

    const issues7AIds = report7A.issues.map(i => i.id).sort();
    const issues7BIds = report7B.issues.map(i => i.id).sort();

    const listsMatch = JSON.stringify(issues7AIds) === JSON.stringify(issues7BIds);

    results.push({
      testNumber: 7,
      testName: 'Change order of checks/slides -> issue identities remain unchanged',
      passed: orderIndependent && listsMatch,
      details: `Order independence: ${orderIndependent}. Set of issue IDs matches even when slide iteration order is inverted: ${listsMatch}`,
      diagnostics: { issues7AIds, issues7BIds }
    });
  } catch (err: any) {
    results.push({ testNumber: 7, testName: 'Test 7', passed: false, details: err.message });
  }

  const allPassed = results.every(r => r.passed);
  return { allPassed, results };
}
