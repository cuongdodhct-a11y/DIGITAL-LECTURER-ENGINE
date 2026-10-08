import fs from 'fs';
import path from 'path';
import { LecturePackage, SlideMapItem } from '../../types/lecture';
import { TeachingBlock } from '../../types/teaching';
import { TeachingPoint } from '../../types/teachingPoint';

function readJson<T>(relativePath: string): T {
  const file = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(file)) throw new Error('Runtime artifact not found: ' + relativePath);
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

type GateBPackage = any;
type GroundedScript = any;
type RuntimeMapping = {
  schemaVersion: number;
  packageId: string;
  slideCount: number;
  teachingPoints: Array<{ id: string; slideNumber: number }>;
};

export function loadRuntimeLecturePackage(packageId: string): LecturePackage {
  if (packageId === 'LPKG-1MD1-001') {
    throw new Error('Use the production 1MD1 package provider for LPKG-1MD1-001.');
  }

  const pkg: GateBPackage = readJson<GateBPackage>(
    `data/courses/1MD/packages/${packageId.replace('LPKG-', '').replace('-001', '')}/lecture.package.json`
  );
  const script: GroundedScript = readJson<GroundedScript>(
    `data/courses/1MD/packages/${packageId.replace('LPKG-', '').replace('-001', '')}/grounded.script.json`
  );
  const mapping: RuntimeMapping = readJson<RuntimeMapping>(
    `data/courses/1MD/packages/${packageId.replace('LPKG-', '').replace('-001', '')}/runtime.mapping.json`
  );

  if (pkg.packageId !== packageId || script.packageId !== packageId || mapping.packageId !== packageId) {
    throw new Error('Runtime package ownership mismatch for ' + packageId);
  }

  const sourceHierarchy = (pkg.sourceRefs || []).map((source: any) => ({
    sourceId: source.sourceId,
    level: source.level,
    title: source.filename,
    role: source.role,
    filename: source.filename
  }));

  const mappingByPoint = new Map(mapping.teachingPoints.map(item => [item.id, item.slideNumber]));

  const teachingBlocks: TeachingBlock[] = (pkg.teachingBlocks || []).map((block: any) => {
    const groundedBlock = (script.teachingBlocks || []).find((b: any) => b.blockId === block.id);
    const points = groundedBlock?.teachingPoints || [];
    const lectureText = points.map((point: any) => point.script).join(' ');
    const sources = (block.sourceRefs || []).map((sourceId: string) => ({
      sourceId,
      citation: sourceId === 'SRC-1MD2-L1' ? '1.MĐ2.docx — kế hoạch bài giảng/nguồn nội dung chuẩn' : '1.MĐ2.pptx — khung trình chiếu',
      sourceType: sourceId === 'SRC-1MD2-L1' ? 'DOCX' : 'PPTX',
      pageOrSlide: sourceId === 'SRC-1MD2-L1' ? undefined : `Slides ${block.slideStart}-${block.slideEnd}`,
      confidence: 'HIGH' as const,
      contentType: 'CORE_CONTENT' as const,
      isUnsupported: false
    }));

    return {
      id: block.id,
      slideStart: block.slideStart,
      slideEnd: block.slideEnd,
      topic: block.topic,
      purpose: block.keyPoints?.[0] || block.topic,
      objectiveIds: (pkg.objectives || []).map((o: any) => o.id),
      keyPoints: block.keyPoints || [],
      lectureText,
      pedagogicalMethod: block.method || 'Thuyết trình, nêu vấn đề, đàm thoại, trực quan',
      question: '',
      waitSeconds: 10,
      expectedResponse: '',
      example: '',
      application: '',
      transition: '',
      durationSeconds: block.durationSeconds,
      sources,
      contentType: 'CORE_CONTENT',
      status: 'READY'
    };
  });

  const slideMap: SlideMapItem[] = Array.from({ length: mapping.slideCount }, (_, index) => {
    const slideNumber = index + 1;
    const block = teachingBlocks.find(b => slideNumber >= b.slideStart && slideNumber <= b.slideEnd);
    return {
      slideNumber,
      title: block ? block.topic : `Slide ${slideNumber}`,
      sourceText: '',
      mappedTeachingBlockIds: block ? [block.id] : [],
      status: block ? 'MAPPED' : 'UNMAPPED',
      issues: [],
      sourceDocumentId: 'SRC-1MD2-L3',
      provenance: { sourceId: 'SRC-1MD2-L3', locator: { slideNumber } }
    };
  });

  const teachingPoints: TeachingPoint[] = (script.teachingBlocks || []).flatMap((groundedBlock: any) => {
    const runtimeBlock = teachingBlocks.find(block => block.id === groundedBlock.blockId)!;
    const points = groundedBlock.teachingPoints || [];
    const duration = Math.max(1, Math.floor(runtimeBlock.durationSeconds / Math.max(1, points.length)));

    return points.map((point: any, index: number) => {
      const slideNumber = mappingByPoint.get(point.id);
      if (!slideNumber) throw new Error('Missing runtime slide anchor for ' + point.id);

      const firstClaim = point.claims?.[0];
      return {
        id: point.id,
        packageId,
        teachingBlockId: groundedBlock.blockId,
        slideNumber,
        sequence: index + 1,
        title: point.title,
        pointType: 'THEORETICAL_ARGUMENT',
        sourceText: point.script,
        explanation: point.script,
        emphasis: firstClaim?.claim || point.title,
        transition: '',
        durationSeconds: duration,
        provenance: {
          sourceId: firstClaim?.sourceRefs?.[0] || 'SRC-1MD2-L1',
          locator: { slideNumber }
        }
      };
    });
  });

  const citationMap: Record<string, any[]> = {};
  for (const groundedBlock of script.teachingBlocks || []) {
    citationMap[groundedBlock.blockId] = (groundedBlock.teachingPoints || []).flatMap((point: any) =>
      (point.claims || []).map((claim: any) => ({
        id: claim.id,
        claim: claim.claim,
        sourceIds: claim.sourceRefs || [],
        sourceType: 'PRIMARY_PACKAGE_SOURCE',
        sourceLevel: 1,
        confidence: claim.confidence || 'HIGH',
        contentType: 'CORE_CONTENT',
        isUnsupported: Boolean(claim.isUnsupported)
      }))
    );
  }

  const now = new Date().toISOString();
  const totalSeconds = Number(script.timing?.totalSeconds || pkg.timingPlan?.mappedSeconds || 0);

  return {
    id: packageId,
    version: 1,
    status: 'TEACHING',
    metadata: {
      courseCode: '1MĐ',
      courseTitle: 'Mỹ học Mác - Lênin',
      lectureNumber: pkg.lessonNumber,
      lectureTitle: pkg.title,
      academicUnit: 'Khoa Triết học Mác - Lênin',
      targetDegree: 'Đại học',
      plannedDurationMinutes: Number(script.timing?.totalMinutes || 180),
      authorLecturer: 'Thượng tá, ThS Đỗ Đình Cường',
      pedagogicalFocus: 'SOURCE_AUTHORITATIVE_READ_ONLY',
      createdAt: now,
      updatedAt: now
    },
    objectives: (pkg.objectives || []).map((o: any, index: number) => ({
      id: o.id,
      code: `OBJ-${index + 1}`,
      statement: o.statement,
      cognitiveLevel: 'ANALYSIS',
      targetAudience: 'Học viên đại học',
      mappedBlockIds: (pkg.teachingBlocks || []).filter((b: any) => b.sourceRefs?.includes(o.sourceRef)).map((b: any) => b.id)
    })),
    requirements: [],
    sourceHierarchy,
    lectureStructure: (pkg.structure || []).map((section: any) => ({
      sectionId: section.sectionId,
      sectionTitle: section.title,
      allocatedMinutes: Math.round(((pkg.teachingBlocks || []).find((b: any) => b.id === section.blockIds?.[0])?.durationSeconds || 0) / 60),
      teachingBlockIds: section.blockIds || []
    })),
    timingPlan: {
      totalPlannedSeconds: totalSeconds,
      totalActualSeconds: 0,
      remainingSeconds: totalSeconds,
      varianceSeconds: 0,
      blockTimings: Object.fromEntries((pkg.teachingBlocks || []).map((b: any) => [b.id, b.durationSeconds])),
      bufferSeconds: 0,
      isMismatch: false
    },
    slideMap,
    teachingBlocks,
    teachingPoints,
    interactionPlan: teachingBlocks.map(block => ({
      blockId: block.id,
      checkpointPrompt: '',
      waitSeconds: 10,
      fallbackPrompt: ''
    })),
    transitionPlan: teachingBlocks.slice(0, -1).map((block, index) => ({
      fromBlockId: block.id,
      toBlockId: teachingBlocks[index + 1].id,
      transitionScript: `Chuyển sang ${teachingBlocks[index + 1].topic}.`
    })),
    citationMap,
    qualityControl: {
      auditRunId: 'RUNTIME_GATE_C',
      timestamp: now,
      totalChecks: 0,
      passedCount: 0,
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      resolvedCount: 0,
      disappearedCount: 0,
      canApprove: false,
      issues: [],
      summaryNarrative: 'Runtime package assembled from verified Gate B/C artifacts; content is read-only.'
    },
    unresolvedIssues: []
  };
}
