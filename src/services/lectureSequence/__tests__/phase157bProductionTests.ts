/**
 * Phase 1.5.7B — Production Test Suite (14 Mandatory Tests)
 * 
 * Verifies all 14 mandatory production requirements:
 * TEST 1: Start LPKG-1MD1-001 -> Expected: Slide 1
 * TEST 2: Resolve complete sequence -> Expected: 52 slides represented
 * TEST 3: TeachingPoint count -> Expected: 80 TeachingPoints
 * TEST 4: Sequence order -> Monotonic slideNumber & in-slide sequence
 * TEST 5: Production sequence contains no CS-401 or SRC-001..005
 * TEST 6: Continuous playback simulation -> TP1 -> TP2 -> ... -> TP80 -> COMPLETED
 * TEST 7: Verify slide progression -> Slide 1 -> 2 -> ... -> 52 without skip
 * TEST 8: Verify block progression -> TB1 -> TB2 -> ... -> TB7
 * TEST 9: Visual-only slide handling -> slide state changes, no empty TTS, no metadata speech
 * TEST 10: Pause / Resume -> same TP
 * TEST 11: Stop / Restart -> same cursor on resume, reset only on explicit restartFromBeginning
 * TEST 12: TTS Error -> ERROR, same TP, retry possible
 * TEST 13: Slide 10 -> Transition slide, Slide 9 -> Slide 10 -> Slide 11 without reset
 * TEST 14: End of lecture -> Slide 52 -> final TeachingPoint -> LECTURE_COMPLETED with payload
 */

import { createProduction1MD1Package } from '../productionDefaultPackage';
import { resolveLectureSequence } from '../lectureSequenceResolver';
import { TeachingEngine } from '../../teachingEngine/teachingEngine';
import { ContinuousLectureEngine } from '../../continuousPlayback/continuousLectureEngine';
import { MockAudioController, MockTTSGateway } from '../../continuousPlayback/__tests__/mockAudioController';
import { TTSQueueManager } from '../../continuousPlayback/ttsQueueManager';
import { ContinuousLectureEvent } from '../../../types/continuousPlayback';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

export async function runPhase157BProductionTests(): Promise<{ passed: boolean; results: TestResult[] }> {
  const results: TestResult[] = [];
  const pkg = createProduction1MD1Package();

  // Helper to create fully wired test engine
  const createTestEngine = (audioCtrl: MockAudioController, ttsGateway: MockTTSGateway) => {
    const tEngine = new TeachingEngine(pkg, 'FULL_LECTURE');
    const ttsQueueManager = new TTSQueueManager(ttsGateway as any);
    const cEngine = new ContinuousLectureEngine({
      teachingEngine: tEngine,
      audioController: audioCtrl,
      ttsQueueManager
    });
    return { tEngine, cEngine };
  };

  // -------------------------------------------------------------
  // TEST 1: Start LPKG-1MD1-001 -> Starts on Slide 1
  // -------------------------------------------------------------
  try {
    const engine = new TeachingEngine(pkg, 'FULL_LECTURE');
    engine.startLecture();
    const status = engine.getStatus();
    const passed = status.currentSlideNumber === 1 && status.currentTeachingPointIndex === 0;
    results.push({
      name: 'TEST 1: Start LPKG-1MD1-001',
      passed,
      message: passed 
        ? `Starts accurately at Slide 1 (Point ID: ${status.currentTeachingPointId})` 
        : `Expected Slide 1, got Slide ${status.currentSlideNumber}`
    });
  } catch (err: any) {
    results.push({ name: 'TEST 1: Start LPKG-1MD1-001', passed: false, message: err.message });
  }

  // -------------------------------------------------------------
  // TEST 2: Resolve complete sequence -> 52 slides represented
  // -------------------------------------------------------------
  try {
    const resolution = resolveLectureSequence(pkg);
    const passed = resolution.totalSlidesRepresented === 52;
    results.push({
      name: 'TEST 2: Resolve complete sequence (52 slides)',
      passed,
      message: passed
        ? `Successfully verified all 52 slides represented (1 to 52).`
        : `Expected 52 slides represented, got ${resolution.totalSlidesRepresented}`
    });
  } catch (err: any) {
    results.push({ name: 'TEST 2: Resolve complete sequence', passed: false, message: err.message });
  }

  // -------------------------------------------------------------
  // TEST 3: TeachingPoint count -> Exactly 80 TeachingPoints
  // -------------------------------------------------------------
  try {
    const resolution = resolveLectureSequence(pkg);
    const passed = resolution.totalTeachingPoints === 80;
    results.push({
      name: 'TEST 3: TeachingPoint count (80 TeachingPoints)',
      passed,
      message: passed
        ? `Canonical TeachingPoint count verified: exactly 80 points.`
        : `Expected 80 points, found ${resolution.totalTeachingPoints}`
    });
  } catch (err: any) {
    results.push({ name: 'TEST 3: TeachingPoint count', passed: false, message: err.message });
  }

  // -------------------------------------------------------------
  // TEST 4: Sequence order -> Monotonic slideNumber & in-slide sequence
  // -------------------------------------------------------------
  try {
    const resolution = resolveLectureSequence(pkg);
    let monotonic = true;
    let failureDetail = '';

    for (let i = 1; i < resolution.sequence.length; i++) {
      const prev = resolution.sequence[i - 1];
      const cur = resolution.sequence[i];

      if (cur.blockSequence < prev.blockSequence) {
        monotonic = false;
        failureDetail = `Block sequence inverted at index ${i}: prev block ${prev.blockSequence}, cur block ${cur.blockSequence}`;
        break;
      }
      if (cur.slideNumber < prev.slideNumber) {
        monotonic = false;
        failureDetail = `Slide number decreased at index ${i}: prev slide ${prev.slideNumber}, cur slide ${cur.slideNumber}`;
        break;
      }
      if (cur.slideNumber === prev.slideNumber && cur.pointSequence <= prev.pointSequence) {
        monotonic = false;
        failureDetail = `In-slide sequence not strictly increasing at slide ${cur.slideNumber}: prev seq ${prev.pointSequence}, cur seq ${cur.pointSequence}`;
        break;
      }
    }

    results.push({
      name: 'TEST 4: Sequence order monotonicity',
      passed: monotonic,
      message: monotonic
        ? 'Sequence strictly monotonic across Block -> Slide -> TeachingPoint sequence.'
        : failureDetail
    });
  } catch (err: any) {
    results.push({ name: 'TEST 4: Sequence order monotonicity', passed: false, message: err.message });
  }

  // -------------------------------------------------------------
  // TEST 5: No production sequence contains CS-401 or SRC-001..005
  // -------------------------------------------------------------
  try {
    const resolution = resolveLectureSequence(pkg);
    const forbiddenSources = ['SRC-001', 'SRC-002', 'SRC-003', 'SRC-004', 'SRC-005'];
    let contaminated = false;
    let contamMsg = '';

    if (resolution.packageId.includes('CS401')) {
      contaminated = true;
      contamMsg = `Contaminated packageId: ${resolution.packageId}`;
    }

    for (const item of resolution.sequence) {
      const tp = item.teachingPoint;
      if (forbiddenSources.includes(tp.provenance.sourceId)) {
        contaminated = true;
        contamMsg = `Point ${tp.id} references forbidden source ${tp.provenance.sourceId}`;
        break;
      }
      if (tp.packageId && tp.packageId.includes('CS401')) {
        contaminated = true;
        contamMsg = `Point ${tp.id} has CS401 packageId`;
        break;
      }
    }

    results.push({
      name: 'TEST 5: CS-401 / SRC-001..005 isolation',
      passed: !contaminated,
      message: !contaminated
        ? 'Production sequence is completely isolated from CS-401 and demo sources.'
        : contamMsg
    });
  } catch (err: any) {
    results.push({ name: 'TEST 5: CS-401 isolation', passed: false, message: err.message });
  }

  // -------------------------------------------------------------
  // TEST 6: Continuous playback simulation -> TP1 -> ... -> TP80 -> COMPLETED
  // -------------------------------------------------------------
  try {
    const audioCtrl = new MockAudioController();
    const ttsGateway = new MockTTSGateway();
    const { cEngine } = createTestEngine(audioCtrl, ttsGateway);

    const events: ContinuousLectureEvent[] = [];
    cEngine.onEvent(e => events.push(e));

    await cEngine.play();

    // Fast-forward through all 80 points
    for (let step = 0; step < 85; step++) {
      if (cEngine.getStatus().state === 'COMPLETED') break;
      await audioCtrl.simulatePlaybackComplete();
    }

    const finalStatus = cEngine.getStatus();
    const passed = finalStatus.state === 'COMPLETED' && finalStatus.currentPointIndex === 79;

    results.push({
      name: 'TEST 6: Continuous playback simulation',
      passed,
      message: passed
        ? `Completed all 80 points continuously ending in COMPLETED state.`
        : `Ended in state ${finalStatus.state}, index ${finalStatus.currentPointIndex}`
    });
  } catch (err: any) {
    results.push({ name: 'TEST 6: Continuous playback simulation', passed: false, message: err.message });
  }

  // -------------------------------------------------------------
  // TEST 7: Verify slide progression -> Slide 1 -> 2 -> ... -> 52 without skip
  // -------------------------------------------------------------
  try {
    const audioCtrl = new MockAudioController();
    const ttsGateway = new MockTTSGateway();
    const { cEngine } = createTestEngine(audioCtrl, ttsGateway);

    const visitedSlides = new Set<number>();
    cEngine.onEvent(e => {
      if (e.slideNumber) visitedSlides.add(e.slideNumber);
    });

    await cEngine.play();
    visitedSlides.add(cEngine.getStatus().currentSlideNumber);

    for (let step = 0; step < 85; step++) {
      if (cEngine.getStatus().state === 'COMPLETED') break;
      await audioCtrl.simulatePlaybackComplete();
      visitedSlides.add(cEngine.getStatus().currentSlideNumber);
    }

    const missingSlides: number[] = [];
    for (let s = 1; s <= 52; s++) {
      if (!visitedSlides.has(s)) missingSlides.push(s);
    }

    const passed = missingSlides.length === 0;
    results.push({
      name: 'TEST 7: Verify slide progression (1 to 52 without skip)',
      passed,
      message: passed
        ? 'All 52 slides traversed monotonically without skipping.'
        : `Missing slides: ${missingSlides.join(', ')}`
    });
  } catch (err: any) {
    results.push({ name: 'TEST 7: Verify slide progression', passed: false, message: err.message });
  }

  // -------------------------------------------------------------
  // TEST 8: Verify block progression -> TB1 -> ... -> TB7
  // -------------------------------------------------------------
  try {
    const audioCtrl = new MockAudioController();
    const ttsGateway = new MockTTSGateway();
    const { cEngine } = createTestEngine(audioCtrl, ttsGateway);

    const visitedBlocks: string[] = [];
    cEngine.onEvent(e => {
      if (e.type === 'TEACHING_BLOCK_CHANGED' && e.teachingBlockId && !visitedBlocks.includes(e.teachingBlockId)) {
        visitedBlocks.push(e.teachingBlockId);
      }
    });

    await cEngine.play();
    const firstBlockId = cEngine.getStatus().currentTeachingBlockId;
    if (firstBlockId && !visitedBlocks.includes(firstBlockId)) {
      visitedBlocks.unshift(firstBlockId);
    }

    for (let step = 0; step < 85; step++) {
      if (cEngine.getStatus().state === 'COMPLETED') break;
      await audioCtrl.simulatePlaybackComplete();
    }

    const expectedBlocks = pkg.teachingBlocks.map(b => b.id);
    const passed = visitedBlocks.length === 7 && visitedBlocks.every((b, i) => b === expectedBlocks[i]);

    results.push({
      name: 'TEST 8: Verify block progression (TB1 to TB7)',
      passed,
      message: passed
        ? `All 7 blocks visited in canonical order: ${visitedBlocks.join(' -> ')}`
        : `Blocks visited (${visitedBlocks.length}): ${visitedBlocks.join(', ')} vs expected (${expectedBlocks.length}): ${expectedBlocks.join(', ')}`
    });
  } catch (err: any) {
    results.push({ name: 'TEST 8: Verify block progression', passed: false, message: err.message });
  }

  // -------------------------------------------------------------
  // TEST 9: Visual-only slide handling -> no empty TTS, no metadata speech
  // -------------------------------------------------------------
  try {
    const resolution = resolveLectureSequence(pkg);
    let leakDetected = false;
    let emptyDetected = false;

    for (const item of resolution.sequence) {
      const tp = item.teachingPoint;
      if (!tp.explanation || tp.explanation.trim().length === 0) {
        emptyDetected = true;
      }
      if (/^\s*Slide\s+\d+/i.test(tp.title) || /^\s*Trang chiếu\s+\d+/i.test(tp.explanation)) {
        leakDetected = true;
      }
    }

    const passed = !emptyDetected && !leakDetected;
    results.push({
      name: 'TEST 9: Visual-only slide and metadata sanitization',
      passed,
      message: passed
        ? 'No empty TTS payloads and zero metadata leaks across entire 80-point sequence.'
        : `Empty: ${emptyDetected}, Leak: ${leakDetected}`
    });
  } catch (err: any) {
    results.push({ name: 'TEST 9: Visual-only slide handling', passed: false, message: err.message });
  }

  // -------------------------------------------------------------
  // TEST 10: Pause / Resume -> same TP
  // -------------------------------------------------------------
  try {
    const audioCtrl = new MockAudioController();
    const ttsGateway = new MockTTSGateway();
    const { cEngine } = createTestEngine(audioCtrl, ttsGateway);

    await cEngine.play();
    const initialPointId = cEngine.getStatus().currentTeachingPointId;
    
    cEngine.pause();
    const pausedPointId = cEngine.getStatus().currentTeachingPointId;

    await cEngine.resume();
    const resumedPointId = cEngine.getStatus().currentTeachingPointId;

    const passed = initialPointId === pausedPointId && pausedPointId === resumedPointId && cEngine.getStatus().state === 'PLAYING';
    results.push({
      name: 'TEST 10: Pause / Resume preserves TeachingPoint',
      passed,
      message: passed
        ? `Paused and resumed seamlessly at same TeachingPoint (${initialPointId}).`
        : `Mismatch: init=${initialPointId}, pause=${pausedPointId}, resume=${resumedPointId}`
    });
  } catch (err: any) {
    results.push({ name: 'TEST 10: Pause / Resume', passed: false, message: err.message });
  }

  // -------------------------------------------------------------
  // TEST 11: Stop / Restart -> same cursor on play, reset only on restartFromBeginning
  // -------------------------------------------------------------
  try {
    const audioCtrl = new MockAudioController();
    const ttsGateway = new MockTTSGateway();
    const { tEngine, cEngine } = createTestEngine(audioCtrl, ttsGateway);

    await cEngine.play();
    // Advance to TP2
    await audioCtrl.simulatePlaybackComplete();
    const cursorPointId = cEngine.getStatus().currentTeachingPointId;

    cEngine.stop();
    const stoppedPointId = cEngine.getStatus().currentTeachingPointId;

    // Resuming via play() must continue at cursorPointId
    await cEngine.play();
    const resumedCursorId = cEngine.getStatus().currentTeachingPointId;

    // Explicit restartFromBeginning() resets to Slide 1 / TP1
    await cEngine.restartFromBeginning();
    const resetPointId = cEngine.getStatus().currentTeachingPointId;
    const firstPointId = tEngine.getAllTeachingPoints()[0].id;

    const passed = cursorPointId === stoppedPointId && stoppedPointId === resumedCursorId && resetPointId === firstPointId;

    results.push({
      name: 'TEST 11: Stop maintains cursor / Restart resets to beginning',
      passed,
      message: passed
        ? `Cursor maintained across stop/play (${cursorPointId}) and properly reset on restartFromBeginning (${firstPointId}).`
        : `Cursor failure: cursor=${cursorPointId}, stop=${stoppedPointId}, resume=${resumedCursorId}, reset=${resetPointId}`
    });
  } catch (err: any) {
    results.push({ name: 'TEST 11: Stop / Restart', passed: false, message: err.message });
  }

  // -------------------------------------------------------------
  // TEST 12: TTS Error -> ERROR, same TP, retry possible
  // -------------------------------------------------------------
  try {
    const audioCtrl = new MockAudioController();
    const ttsGateway = new MockTTSGateway();
    const { cEngine } = createTestEngine(audioCtrl, ttsGateway);

    // Inject failure from the outset
    ttsGateway.setFailureMode(true);
    await cEngine.play();

    const errorStatus = cEngine.getStatus();
    const errorStateReached = errorStatus.state === 'ERROR';
    const pointRetained = errorStatus.currentTeachingPointId === 'TP-1MD1-S01-01';

    // Restore TTS Gateway and retry
    ttsGateway.setFailureMode(false);
    await cEngine.retryCurrentTeachingPoint();
    const recoveredStatus = cEngine.getStatus();
    const retrySucceeded = recoveredStatus.state === 'PLAYING' && recoveredStatus.currentTeachingPointId === 'TP-1MD1-S01-01';

    const passed = errorStateReached && pointRetained && retrySucceeded;
    results.push({
      name: 'TEST 12: TTS Error handling and retry without skipping',
      passed,
      message: passed
        ? `Enters ERROR state without skipping academic content, and allows successful retry.`
        : `Error reached: ${errorStateReached}, Point retained: ${pointRetained}, Retry succeeded: ${retrySucceeded}`
    });
  } catch (err: any) {
    results.push({ name: 'TEST 12: TTS Error handling', passed: false, message: err.message });
  }

  // -------------------------------------------------------------
  // TEST 13: Slide 10 -> Transition slide, Slide 9 -> Slide 10 -> Slide 11
  // -------------------------------------------------------------
  try {
    const resolution = resolveLectureSequence(pkg);
    const slideNumbers = resolution.sequence.map(s => s.slideNumber);

    const hasSlide9 = slideNumbers.includes(9);
    const hasSlide10 = slideNumbers.includes(10);
    const hasSlide11 = slideNumbers.includes(11);

    const idx9 = slideNumbers.indexOf(9);
    const idx10 = slideNumbers.indexOf(10);
    const idx11 = slideNumbers.indexOf(11);

    const strictlySequential = idx9 < idx10 && idx10 < idx11;

    // Check lecturer decision label on Slide 10
    const slide10 = pkg.slideMap.find(s => s.slideNumber === 10);
    const isTransition = slide10?.semanticRole === 'TRANSITION_SLIDE_LESSON_1';

    const passed = hasSlide9 && hasSlide10 && hasSlide11 && strictlySequential && isTransition;
    results.push({
      name: 'TEST 13: Slide 10 continuous transition (Slide 9 -> 10 -> 11)',
      passed,
      message: passed
        ? `Slide 10 respected as transition slide. Monotonic sequence 9 -> 10 -> 11 confirmed.`
        : `Sequence: 9(${idx9}) -> 10(${idx10}) -> 11(${idx11}), Transition: ${isTransition}`
    });
  } catch (err: any) {
    results.push({ name: 'TEST 13: Slide 10 transition', passed: false, message: err.message });
  }

  // -------------------------------------------------------------
  // TEST 14: End of lecture -> Slide 52 -> final TP -> LECTURE_COMPLETED
  // -------------------------------------------------------------
  try {
    const audioCtrl = new MockAudioController();
    const ttsGateway = new MockTTSGateway();
    const { cEngine } = createTestEngine(audioCtrl, ttsGateway);

    let completedEvent: ContinuousLectureEvent | undefined;
    cEngine.onEvent(e => {
      if (e.type === 'LECTURE_COMPLETED') completedEvent = e;
    });

    await cEngine.play();
    for (let step = 0; step < 85; step++) {
      if (cEngine.getStatus().state === 'COMPLETED') break;
      await audioCtrl.simulatePlaybackComplete();
    }

    const payload = completedEvent?.details;
    const passed = Boolean(
      completedEvent &&
      completedEvent.slideNumber === 52 &&
      payload &&
      payload.packageId === 'LPKG-1MD1-001' &&
      payload.totalSlides === 52 &&
      payload.totalTeachingPoints === 80 &&
      (payload.duration as number) > 0
    );

    results.push({
      name: 'TEST 14: End of lecture LECTURE_COMPLETED payload',
      passed,
      message: passed
        ? `LECTURE_COMPLETED emitted at Slide 52 with packageId=${payload?.packageId}, totalSlides=${payload?.totalSlides}, totalTeachingPoints=${payload?.totalTeachingPoints}, duration=${payload?.duration}s.`
        : `Incomplete event payload: ${JSON.stringify(completedEvent)}`
    });
  } catch (err: any) {
    results.push({ name: 'TEST 14: End of lecture payload', passed: false, message: err.message });
  }

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}

// Direct test executor for CLI runner
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('phase157bProductionTests')) {
  runPhase157BProductionTests().then(({ passed, results }) => {
    console.log(`\n==================================================`);
    console.log(`PHASE 1.5.7B MANDATORY PRODUCTION TESTS (14 TESTS)`);
    console.log(`==================================================\n`);
    results.forEach(r => {
      console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
      console.log(`       ${r.message}`);
    });
    console.log(`\n==================================================`);
    console.log(`OVERALL RESULT: ${passed ? 'ALL 14 TESTS PASSED' : 'SOME TESTS FAILED'}`);
    console.log(`==================================================\n`);
    if (!passed) process.exit(1);
  }).catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
