/**
 * Phase 1.5.7B — Production Lecture Sequence Resolver
 * 
 * Rules:
 * 1. Takes active package (or package by packageId).
 * 2. Reads teachingBlocks strictly according to package sequence/order.
 * 3. In each TeachingBlock:
 *    - traverses slideMap in slide order;
 *    - in each slide gets TeachingPoints strictly sorted by:
 *        block.sequence -> slideNumber -> teachingPoint.sequence
 * 4. NEVER sorts by ID string, timestamp, script ID, source ID, or random object order.
 * 5. Ensures complete deterministic sequence: Block -> Slide -> TeachingPoint.
 */

import { LecturePackage } from '../../types/lecture';
import { TeachingPoint } from '../../types/teachingPoint';
import { build1MD1TeachingPoints } from '../teachingScript/teachingPointScriptBuilder';

export interface ResolvedLectureSequenceItem {
  index: number;
  teachingBlockId: string;
  blockSequence: number;
  slideNumber: number;
  pointSequence: number;
  teachingPoint: TeachingPoint;
}

export interface LectureSequenceResolution {
  packageId: string;
  totalSlidesRepresented: number;
  slidesRepresented: number[];
  totalTeachingPoints: number;
  totalBlocks: number;
  teachingBlockIds: string[];
  totalDurationSeconds: number;
  sequence: ResolvedLectureSequenceItem[];
  teachingPoints: TeachingPoint[];
  visualOnlySlides: number[];
}

/**
 * Resolves the canonical production lecture sequence for a given package.
 */
export function resolveLectureSequence(
  lecturePackage: LecturePackage,
  customPoints?: TeachingPoint[]
): LectureSequenceResolution {
  if (!lecturePackage) {
    throw new Error('resolveLectureSequence requires a valid LecturePackage.');
  }

  // 1. Gather all candidate TeachingPoints
  let rawPoints: TeachingPoint[] = [];
  const pkgAny = lecturePackage as any;
  if (customPoints && customPoints.length > 0) {
    rawPoints = [...customPoints];
  } else if (pkgAny.teachingScript?.points && pkgAny.teachingScript.points.length > 0) {
    rawPoints = [...pkgAny.teachingScript.points];
  } else if (lecturePackage.id === 'LPKG-1MD1-001') {
    rawPoints = build1MD1TeachingPoints();
  } else {
    // Generic fallback for test fixtures
    rawPoints = (lecturePackage.teachingBlocks || []).flatMap((block, bIdx) => {
      const slidesInBlock = (lecturePackage.slideMap || []).filter(
        s => s.slideNumber >= block.slideStart && s.slideNumber <= block.slideEnd
      );
      return slidesInBlock.map((slide, sIdx) => ({
        id: `TP-${block.id}-S${slide.slideNumber}-01`,
        packageId: lecturePackage.id,
        teachingBlockId: block.id,
        slideNumber: slide.slideNumber,
        sequence: 1,
        title: slide.title,
        pointType: 'CONCEPT_DEFINITION',
        sourceText: slide.sourceText || slide.title,
        explanation: `${block.topic}. ${block.lectureText.slice(0, 150)}...`,
        emphasis: block.purpose,
        example: block.example,
        application: block.application,
        transition: block.transition,
        durationSeconds: Math.round(block.durationSeconds / Math.max(1, slidesInBlock.length)),
        provenance: {
          sourceId: block.sources[0]?.sourceId || 'SRC-001',
          locator: { slideNumber: slide.slideNumber }
        }
      }));
    });
  }

  // 2. Build block index lookup for strict Block ordering
  const blockOrderMap = new Map<string, number>();
  (lecturePackage.teachingBlocks || []).forEach((block, index) => {
    blockOrderMap.set(block.id, index);
  });

  // 3. Filter points to those belonging to valid package blocks
  const validPoints = rawPoints.filter(p => {
    if (!p) return false;
    return blockOrderMap.has(p.teachingBlockId);
  });

  // 4. Sort strictly by: Block sequence -> slideNumber -> teachingPoint.sequence
  validPoints.sort((a, b) => {
    const blockOrderA = blockOrderMap.get(a.teachingBlockId) ?? 9999;
    const blockOrderB = blockOrderMap.get(b.teachingBlockId) ?? 9999;
    if (blockOrderA !== blockOrderB) {
      return blockOrderA - blockOrderB;
    }
    if (a.slideNumber !== b.slideNumber) {
      return a.slideNumber - b.slideNumber;
    }
    return (a.sequence || 0) - (b.sequence || 0);
  });

  // 5. Structure sequence items
  const sequence: ResolvedLectureSequenceItem[] = validPoints.map((tp, idx) => ({
    index: idx,
    teachingBlockId: tp.teachingBlockId,
    blockSequence: blockOrderMap.get(tp.teachingBlockId) ?? 0,
    slideNumber: tp.slideNumber,
    pointSequence: tp.sequence,
    teachingPoint: tp
  }));

  const representedSlideSet = new Set<number>(validPoints.map(p => p.slideNumber));
  const slidesRepresented = Array.from(representedSlideSet).sort((a, b) => a - b);
  const totalDurationSeconds = validPoints.reduce((sum, p) => sum + (p.durationSeconds || 0), 0);
  const teachingBlockIds = (lecturePackage.teachingBlocks || []).map(b => b.id);

  // Identify any visual-only slides (slides in slideMap with no TeachingPoints)
  const allSlideNumbers = (lecturePackage.slideMap || []).map(s => s.slideNumber);
  const visualOnlySlides = allSlideNumbers.filter(s => !representedSlideSet.has(s)).sort((a, b) => a - b);

  return {
    packageId: lecturePackage.id,
    totalSlidesRepresented: slidesRepresented.length,
    slidesRepresented,
    totalTeachingPoints: validPoints.length,
    totalBlocks: teachingBlockIds.length,
    teachingBlockIds,
    totalDurationSeconds,
    sequence,
    teachingPoints: validPoints,
    visualOnlySlides
  };
}
