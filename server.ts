/**
 * Digital Lecturer Engine - Production Server Entry Point
 * Full-stack Express backend with server-side Gemini 3.8 models and Vite middleware.
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { extractDocumentContent } from './src/services/documentService/textExtractor';
import { QualityControlEngine } from './src/services/qualityControl/qualityControlEngine';
import { LecturePackageBuilder, buildLecturePackageFromSources } from './src/services/lectureBuilder/lecturePackageBuilder';
import { hashString, generateAudioCacheKey } from './src/utils/hashing';
import {
  SAMPLE_DOCUMENTS,
  SAMPLE_OBJECTIVES,
  SAMPLE_SLIDE_MAP,
  SAMPLE_TEACHING_BLOCKS,
  createSampleLecturePackage
} from './src/sampleData/universityLecturePackage';
import { RegisteredDocument } from './src/types/source';
import { LecturePackage, PackageSummary, LecturerDecisionsRecord } from './src/types/lecture';
import { ResolutionRecord, QCIssue } from './src/types/quality';
import { courseEngineRouter } from './src/services/courseEngine/courseEngineRouter';
import { synthesizeWithTtsGateway, getTtsCacheStats } from './src/services/courseEngine/ttsGatewayService';
import { getCourse } from './src/services/courseEngine/courseRegistry';
import { loadRuntimeLecturePackage } from './src/services/courseEngine/runtimePackageService';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsers must run before the Course Engine router so JSON POST payloads
// are available to package build endpoints.
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/api/course-engine', courseEngineRouter);

// Graceful JSON and payload size error handler (prevents returning HTML error pages)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      error: 'Dung lượng tệp/dữ liệu gửi lên vượt quá giới hạn xử lý của máy chủ (Payload Too Large). Vui lòng chọn tệp nhỏ hơn hoặc trích xuất văn bản trước.'
    });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Định dạng dữ liệu JSON không hợp lệ.' });
  }
  next(err);
});

// In-memory repositories on server with disk backup persistence
const BACKUP_DOCS_PATH = path.join(process.cwd(), 'data', 'registeredDocuments.json');
let registeredDocuments: RegisteredDocument[] = [...SAMPLE_DOCUMENTS];

if (fs.existsSync(BACKUP_DOCS_PATH)) {
  try {
    const raw = fs.readFileSync(BACKUP_DOCS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      registeredDocuments = parsed;
      console.log(`[SourceRegistry] Loaded ${registeredDocuments.length} registered documents from disk persistence.`);
    }
  } catch (err) {
    console.warn('[SourceRegistry] Could not load persisted documents, using defaults:', err);
  }
}

// -------------------------------------------------------------
// PACKAGE REPOSITORY ARCHITECTURE
// Supports multiple concurrent, fully isolated lecture packages
// Phase 1.5.7B: Production isolation enforces LPKG-1MD1-001 as default.
// CS-401 is strictly isolated as a test fixture.
// -------------------------------------------------------------
const packageRepository = new Map<string, LecturePackage>();
let activePackageId = 'LPKG-1MD1-001';

// Pre-build or initialize 1MĐ1 package from real sources (SRC-006 & SRC-007)
const pptxDoc = registeredDocuments.find(d => d.sourceId === 'SRC-006' || (d.documentType === 'PPTX' && d.filename.includes('1.MĐ1')));
const docxDoc = registeredDocuments.find(d => d.sourceId === 'SRC-007' || (d.documentType === 'DOCX' && d.filename.includes('1.MĐ1')));

if (pptxDoc && docxDoc) {
  try {
    const real1md1Pkg = buildLecturePackageFromSources({
      packageId: 'LPKG-1MD1-001',
      pptxSource: pptxDoc,
      docxSource: docxDoc,
      lecturerDecisions: {
        pedagogicalFocusDecision: 'PARTS_I_AND_III',
        slide6OutlineDecision: 'STANDARDIZE_TO_II',
        slide10LabelDecision: 'TRANSITION_SLIDE_LESSON_1',
        approvedAt: new Date().toISOString(),
        approvedBy: 'Thượng tá, ThS Đỗ Đình Cường'
      }
    });
    packageRepository.set(real1md1Pkg.id, real1md1Pkg);
    activePackageId = real1md1Pkg.id;
    console.log('[PackageRepository] Successfully initialized production package LPKG-1MD1-001 as active.');
  } catch (err) {
    console.error('[PackageRepository] Failed to pre-build 1MD1 package:', err);
  }
}

function getActivePackage(): LecturePackage {
  const pkg = packageRepository.get(activePackageId);
  if (!pkg) {
    // If not found in map, attempt to build 1MD1 on the fly
    if (pptxDoc && docxDoc) {
      const real1md1Pkg = buildLecturePackageFromSources({
        packageId: 'LPKG-1MD1-001',
        pptxSource: pptxDoc,
        docxSource: docxDoc,
        lecturerDecisions: {
          pedagogicalFocusDecision: 'PARTS_I_AND_III',
          slide6OutlineDecision: 'STANDARDIZE_TO_II',
          slide10LabelDecision: 'TRANSITION_SLIDE_LESSON_1',
          approvedAt: new Date().toISOString(),
          approvedBy: 'Thượng tá, ThS Đỗ Đình Cường'
        }
      });
      packageRepository.set(real1md1Pkg.id, real1md1Pkg);
      activePackageId = real1md1Pkg.id;
      return real1md1Pkg;
    }
    throw new Error('No active production package found in repository.');
  }
  return pkg;
}

function getPackage(packageId?: string): LecturePackage {
  if (packageId && packageRepository.has(packageId)) {
    return packageRepository.get(packageId)!;
  }
  return getActivePackage();
}

function selectPackage(packageId: string): LecturePackage | undefined {
  if (packageRepository.has(packageId)) {
    activePackageId = packageId;
    return packageRepository.get(packageId);
  }
  return undefined;
}

function getPackageSummaries(): PackageSummary[] {
  const summaries = new Map<string, PackageSummary>();

  for (const [id, pkg] of packageRepository.entries()) {
    if (id === 'LPKG-CS401-007') continue;
    summaries.set(id, {
      id: pkg.id,
      title: pkg.metadata.lectureTitle || pkg.id,
      courseCode: pkg.metadata.courseCode || 'GENERAL',
      status: pkg.status,
      slideCount: pkg.slideMap?.length || 0,
      teachingBlockCount: pkg.teachingBlocks?.length || 0,
      durationMinutes: pkg.metadata?.plannedDurationMinutes || 0,
      isActive: id === activePackageId,
      sourceIds: Array.from(new Set((pkg.sourceHierarchy || []).map(s => s.sourceId)))
    });
  }

  const course = getCourse('COURSE-1MD');
  for (const descriptor of course?.packages || []) {
    if (summaries.has(descriptor.packageId)) continue;
    let slideCount = 0;
    let teachingBlockCount = 0;
    let durationMinutes = 0;
    try {
      const file = path.join(process.cwd(), 'data', 'courses', '1MD', 'packages', descriptor.lessonCode, 'lecture.package.json');
      if (fs.existsSync(file)) {
        const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
        slideCount = Number(raw.sourceRefs?.find((s: any) => s.level === 3)?.slideCount || 0);
        teachingBlockCount = Array.isArray(raw.teachingBlocks) ? raw.teachingBlocks.length : 0;
        durationMinutes = Number(raw.timingPlan?.approvedMinutes || raw.timingPlan?.mappedMinutes || 0);
      }
    } catch {
      // Keep registry-only metadata when runtime artifacts are not yet available.
    }

    summaries.set(descriptor.packageId, {
      id: descriptor.packageId,
      title: descriptor.title,
      courseCode: descriptor.lessonCode,
      status: descriptor.status === 'CONTENT_PENDING' || descriptor.status === 'READY_FOR_QC' ? 'QC_PENDING' : descriptor.status,
      slideCount,
      teachingBlockCount,
      durationMinutes,
      isActive: descriptor.packageId === activePackageId,
      sourceIds: [
        descriptor.sourceSlots.level1.sourceId,
        descriptor.sourceSlots.level3.sourceId
      ].filter(Boolean) as string[]
    });
  }

  return [...summaries.values()].map(summary => ({
    ...summary,
    isActive: summary.id === activePackageId
  }));
}

const serverAudioCache = new Map<string, { audioBase64: string; mimeType: string; duration: number }>();

// Initialize Gemini client safely with server-side environment secret
const apiKey = process.env.GEMINI_API_KEY;
let geminiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    geminiClient = new GoogleGenAI();
    console.log('[Gemini] Initialized GoogleGenAI client with server-side API key.');
  } catch (err) {
    console.warn('[Gemini] Failed to instantiate GoogleGenAI client:', err);
  }
} else {
  console.log('[Gemini] GEMINI_API_KEY not configured or using placeholder. Running with rule-grounded pedagogical engine fallback.');
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

app.get('/api/status', (req: Request, res: Response) => {
  const currentPkg = getActivePackage();
  res.json({
    appName: 'Digital Lecturer Engine',
    version: '1.0.0-phase1.5.7b',
    models: {
      intelligence: 'gemini-3.8-flash',
      voiceRealtime: 'gemini-3.8-live',
      reasoningRealtime: 'gemini-3.8-live-extended-thinking',
      ttsPrimary: 'gemini-3.8-flash-lite-tts',
      ttsSecondary: 'gemini-3.8-flash-tts'
    },
    hasApiKey: !!geminiClient,
    documentsCount: registeredDocuments.length,
    packagesCount: packageRepository.size,
    activePackageId: currentPkg.id,
    packageStatus: currentPkg.status,
    qcCriticalIssues: currentPkg.qualityControl?.criticalCount || 0,
    qcWarningIssues: currentPkg.qualityControl?.warningCount || 0
  });
});

// List all documents
app.get('/api/documents', (req: Request, res: Response) => {
  // In production, exclude CS-401 test fixtures (SRC-001 to SRC-005)
  const productionDocs = registeredDocuments.filter(d => !['SRC-001', 'SRC-002', 'SRC-003', 'SRC-004', 'SRC-005'].includes(d.sourceId));
  res.json({
    documents: productionDocs.sort((a, b) => a.sourceLevel - b.sourceLevel)
  });
});

// Reset or load sample package
app.post('/api/documents/sample-load', (req: Request, res: Response) => {
  // Production safe load of 1MD1
  const docx = registeredDocuments.find(d => d.sourceId === 'SRC-007');
  const pptx = registeredDocuments.find(d => d.sourceId === 'SRC-006');
  if (pptx && docx) {
    const pkg = buildLecturePackageFromSources({
      packageId: 'LPKG-1MD1-001',
      pptxSource: pptx,
      docxSource: docx,
      lecturerDecisions: {
        pedagogicalFocusDecision: 'PARTS_I_AND_III',
        slide6OutlineDecision: 'STANDARDIZE_TO_II',
        slide10LabelDecision: 'TRANSITION_SLIDE_LESSON_1',
        approvedAt: new Date().toISOString(),
        approvedBy: 'Thượng tá, ThS Đỗ Đình Cường'
      }
    });
    packageRepository.set(pkg.id, pkg);
    activePackageId = pkg.id;
    const productionDocs = registeredDocuments.filter(d => !['SRC-001', 'SRC-002', 'SRC-003', 'SRC-004', 'SRC-005'].includes(d.sourceId));
    return res.json({
      success: true,
      message: 'Đã nạp gói bài giảng sản xuất 1MĐ1.',
      documents: productionDocs,
      lecturePackage: pkg
    });
  }
  res.status(500).json({ error: 'Không tìm thấy nguồn tài liệu 1MĐ1' });
});

// Upload and register document
app.post('/api/documents/upload', async (req: Request, res: Response) => {
  try {
    const {
      filename,
      base64Data,
      rawText,
      sourceLevel,
      title,
      author,
      year,
      publisher,
      documentType,
      slideCount,
      pageCount,
      slides,
      fileSize
    } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    let extracted;
    let dataBuffer: ArrayBuffer | string = '';

    if (rawText && documentType) {
      // Pre-extracted on client for zero network overhead & large file reliability
      dataBuffer = rawText;
      extracted = {
        text: rawText,
        documentType,
        pageCount: pageCount || 1,
        slideCount: slideCount || (slides ? slides.length : undefined),
        slides: slides || [],
        detectedSections: slides ? slides.map((s: any) => s.title).filter(Boolean) : []
      };
    } else if (base64Data) {
      const buffer = Buffer.from(base64Data, 'base64');
      dataBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      extracted = await extractDocumentContent(filename, dataBuffer);
    } else if (rawText) {
      dataBuffer = rawText;
      extracted = await extractDocumentContent(filename, rawText);
    } else {
      return res.status(400).json({ error: 'Either base64Data or rawText must be provided' });
    }

    const nextId = `SRC-${(registeredDocuments.length + 1).toString().padStart(3, '0')}`;
    const level = (Number(sourceLevel) >= 1 && Number(sourceLevel) <= 7) ? Number(sourceLevel) as any : 7;

    const newDoc: RegisteredDocument = {
      sourceId: nextId,
      filename,
      documentType: extracted.documentType,
      sourceLevel: level,
      title: title || filename,
      author: author || 'Giảng viên / Tác giả tài liệu',
      year: year || 2026,
      publisher: publisher || 'Khoa / Nhà xuất bản',
      pageCount: extracted.pageCount,
      slideCount: extracted.slideCount,
      status: 'REGISTERED',
      extractedText: extracted.text,
      metadata: {
        fileSize: fileSize || (typeof dataBuffer === 'string' ? dataBuffer.length : dataBuffer.byteLength),
        extractedAt: new Date().toISOString(),
        checksum: hashString(extracted.text.slice(0, 500)),
        chapterSections: extracted.detectedSections
      }
    };

    registeredDocuments.push(newDoc);
    res.json({ success: true, document: newDoc });
  } catch (err: any) {
    console.error('[Upload] Extraction error:', err);
    res.status(500).json({ error: err.message || 'Failed to process document' });
  }
});

// Delete document
app.delete('/api/documents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  registeredDocuments = registeredDocuments.filter(d => d.sourceId !== id);
  res.json({ success: true, remainingCount: registeredDocuments.length });
});

// -------------------------------------------------------------
// LECTURE PACKAGE MANAGEMENT & REPOSITORY ROUTES
// -------------------------------------------------------------

// List all packages in the repository
app.get('/api/lecture/packages', (req: Request, res: Response) => {
  res.json({
    packages: getPackageSummaries(),
    activePackageId
  });
});

// Select active lecture package
app.post('/api/lecture/select-package', (req: Request, res: Response) => {
  const { packageId } = req.body;
  if (!packageId) {
    return res.status(400).json({ error: 'packageId là bắt buộc.' });
  }

  let pkg = packageRepository.get(packageId);
  if (!pkg && packageId === 'LPKG-1MD2-001') {
    try {
      pkg = loadRuntimeLecturePackage(packageId);
      packageRepository.set(packageId, pkg);
    } catch (error: any) {
      return res.status(409).json({
        error: error.message || 'Bài 2 chưa đủ runtime artifacts để mở Giảng đường.'
      });
    }
  }

  if (!pkg) {
    return res.status(404).json({
      error: `Gói bài giảng với ID "${packageId}" chưa được nạp vào Lecture Player runtime.`
    });
  }

  activePackageId = packageId;
  res.json({
    success: true,
    activePackageId,
    lecturePackage: pkg
  });
});

// Build independent lecture package from sources
app.post('/api/lecture/packages/build', async (req: Request, res: Response) => {
  try {
    const {
      packageId = 'LPKG-1MD1-001',
      sourceIds = ['SRC-006', 'SRC-007'],
      lecturerDecisions = {
        pedagogicalFocus: 'PARTS_I_AND_III',
        slide6RomanNumerals: 'STANDARDIZE_I_II_III_IV',
        slide10Role: 'TRANSITION_SLIDE_LESSON_1'
      },
      setAsActive = true
    } = req.body;

    if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length < 2) {
      return res.status(400).json({ error: 'sourceIds phải là danh sách ít nhất 2 nguồn tài liệu (PPTX và DOCX).' });
    }

    const foundSources = registeredDocuments.filter(d => sourceIds.includes(d.sourceId));
    if (foundSources.length < 2) {
      return res.status(404).json({
        error: `Không tìm thấy đủ tài liệu trong kho. Đã tìm thấy: ${foundSources.map(d => d.sourceId).join(', ')}`
      });
    }

    const pptxSource = foundSources.find(d => d.documentType === 'PPTX' || d.filename.endsWith('.pptx'));
    const docxSource = foundSources.find(d => d.documentType === 'DOCX' || d.filename.endsWith('.docx'));

    if (!pptxSource || !docxSource) {
      return res.status(400).json({ error: 'Cần một tệp trình chiếu PPTX và một tệp kế hoạch bài giảng DOCX để xây dựng gói bài giảng.' });
    }

    const mappedDecisions: LecturerDecisionsRecord = {
      pedagogicalFocusDecision: (lecturerDecisions.pedagogicalFocus || lecturerDecisions.pedagogicalFocusDecision) === 'PARTS_I_AND_II' ? 'PARTS_I_AND_II' : 'PARTS_I_AND_III',
      slide6OutlineDecision: (lecturerDecisions.slide6RomanNumerals === 'STANDARDIZE_I_II_III_IV' || lecturerDecisions.slide6OutlineDecision === 'STANDARDIZE_TO_II') ? 'STANDARDIZE_TO_II' : 'KEEP_AS_PPTX',
      slide10LabelDecision: (lecturerDecisions.slide10Role || lecturerDecisions.slide10LabelDecision) === 'STANDALONE_LESSON_2' ? 'STANDALONE_LESSON_2' : 'TRANSITION_SLIDE_LESSON_1',
      approvedAt: new Date().toISOString(),
      approvedBy: 'Thượng tá, ThS Đỗ Đình Cường'
    };

    const newPackage = buildLecturePackageFromSources({
      packageId,
      pptxSource,
      docxSource,
      lecturerDecisions: mappedDecisions
    });

    packageRepository.set(newPackage.id, newPackage);

    if (setAsActive) {
      activePackageId = newPackage.id;
    }

    res.json({
      success: true,
      activePackageId,
      lecturePackage: newPackage,
      qcReport: newPackage.qualityControl
    });
  } catch (err: any) {
    console.error('[BuildPackage] Error:', err);
    res.status(500).json({ error: err.message || 'Xây dựng gói bài giảng thất bại.' });
  }
});

// Get lecture package (active or specified by ?packageId=...)
app.get('/api/lecture/package', (req: Request, res: Response) => {
  const packageId = req.query.packageId as string;
  const pkg = getPackage(packageId);
  res.json({ lecturePackage: pkg, activePackageId });
});

// Build / Re-analyze Lecture Package (backward-compatible)
app.post('/api/lecture/build-package', async (req: Request, res: Response) => {
  try {
    const pkg = getActivePackage();
    const qc = QualityControlEngine.audit(pkg);
    pkg.qualityControl = qc;
    pkg.unresolvedIssues = qc.issues.filter(i => i.status === 'ACTIVE' || i.status === 'REOPENED');
    pkg.status = qc.criticalCount > 0 ? 'NEEDS_REVIEW' : 'QC_PENDING';

    res.json({
      success: true,
      lecturePackage: pkg,
      activePackageId
    });
  } catch (err: any) {
    console.error('[BuildPackage] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to build package' });
  }
});

// Run explicit Quality Control (for active or ?packageId=...)
app.get('/api/lecture/qc', (req: Request, res: Response) => {
  const packageId = req.query.packageId as string;
  const pkg = getPackage(packageId);
  const qc = QualityControlEngine.audit(pkg);
  res.json({
    packageId: pkg.id,
    packageTitle: pkg.metadata.lectureTitle,
    packageStatus: pkg.status,
    qcReport: qc
  });
});

app.post('/api/lecture/qc', (req: Request, res: Response) => {
  const packageId = (req.query.packageId || req.body.packageId) as string;
  const pkg = getPackage(packageId);
  const qc = QualityControlEngine.audit(pkg);
  pkg.qualityControl = qc;
  pkg.unresolvedIssues = qc.issues.filter(i => i.status === 'ACTIVE' || i.status === 'REOPENED');
  if (qc.criticalCount > 0) {
    pkg.status = 'NEEDS_REVIEW';
  } else if (pkg.status === 'NEEDS_REVIEW') {
    pkg.status = 'QC_PENDING';
  }
  res.json({
    packageId: pkg.id,
    packageTitle: pkg.metadata.lectureTitle,
    packageStatus: pkg.status,
    qcReport: qc
  });
});

// Resolve a QC issue with persistent lecturer sign-off and stable issue identity
app.post('/api/lecture/resolve-issue', (req: Request, res: Response) => {
  const { packageId: explicitPkgId, issueId, issueKey, resolutionComment, actionTaken, lecturerName, decision } = req.body;
  const pkg = getPackage(explicitPkgId);
  
  // Look up issue across all package issues (by stable id, semantic key, or legacy id)
  const allIssues = pkg.qualityControl?.issues || [];
  const issue = allIssues.find(i => 
    i.id === issueId || 
    i.issueKey === issueKey || 
    i.issueKey === issueId || 
    (i.legacyId && i.legacyId === issueId)
  ) || pkg.unresolvedIssues?.find(i => 
    i.id === issueId || 
    i.issueKey === issueKey || 
    i.issueKey === issueId || 
    (i.legacyId && i.legacyId === issueId)
  );

  if (issue) {
    const recordId = `RES-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const resolutionDecision = (decision as any) === 'WAIVED' ? 'WAIVED' : 'RESOLVED';
    const note = resolutionComment || actionTaken || 'Đã được giảng viên xem xét và phê duyệt.';
    const resolvedBy = lecturerName || 'Giảng viên Chủ nhiệm học phần';

    const resolutionRecord: ResolutionRecord = {
      id: recordId,
      issueId: issue.id,
      issueKey: issue.issueKey,
      auditRunId: pkg.qualityControl?.auditRunId || 'INITIAL_RUN',
      issueType: issue.category,
      severity: issue.severity,
      lecturerDecision: resolutionDecision,
      lecturerNote: note,
      resolvedAt: new Date().toISOString(),
      resolvedBy,
      affectedSource: issue.targetType === 'SOURCE' ? issue.targetId : undefined,
      affectedSlide: issue.targetType === 'SLIDE' ? issue.targetId : undefined,
      affectedTeachingBlock: issue.targetType === 'BLOCK' ? issue.targetId : undefined
    };

    if (!issue.resolutionHistory) {
      issue.resolutionHistory = [];
    }
    issue.resolutionHistory.push(resolutionRecord);

    issue.resolved = true;
    issue.resolvedByLecturer = true;
    issue.status = resolutionDecision;
    issue.lecturerComment = note;

    // If it was slide mismatch, acknowledge the slide in slideMap
    if (issue.category === 'SLIDE_CONTENT_MISMATCH' && issue.targetId) {
      const slideNum = parseInt(issue.targetId.replace(/[^0-9]/g, ''), 10);
      const slide = pkg.slideMap.find(s => s.slideNumber === slideNum);
      if (slide) {
        slide.status = 'MAPPED';
        slide.issues = [`Đã ghi nhận bởi giảng viên: ${note}`];
      }
    }

    // Re-run audit with full reconciliation
    const qc = QualityControlEngine.audit(pkg);
    pkg.qualityControl = qc;
    pkg.unresolvedIssues = qc.issues.filter(i => i.status === 'ACTIVE' || i.status === 'REOPENED');

    if (qc.criticalCount === 0 && pkg.status === 'NEEDS_REVIEW') {
      pkg.status = 'QC_PENDING';
    }

    res.json({ success: true, resolutionRecord, qcReport: qc, activePackage: pkg });
  } else {
    res.status(404).json({ error: `Issue not found: ${issueId || issueKey}` });
  }
});

// Approve lecture package
app.post('/api/lecture/approve', (req: Request, res: Response) => {
  const { packageId: explicitPkgId } = req.body;
  const pkg = getPackage(explicitPkgId);
  const qc = QualityControlEngine.audit(pkg);
  if (qc.criticalCount > 0) {
    return res.status(400).json({
      error: `Không thể phê duyệt: Còn ${qc.criticalCount} vấn đề CRITICAL chưa được giảng viên giải quyết.`,
      issues: qc.issues.filter(i => i.severity === 'CRITICAL' && (i.status === 'ACTIVE' || i.status === 'REOPENED'))
    });
  }

  pkg.status = 'APPROVED';
  res.json({ success: true, status: 'APPROVED', lecturePackage: pkg });
});

// Lock lecture package
app.post('/api/lecture/lock', (req: Request, res: Response) => {
  const { packageId: explicitPkgId } = req.body;
  const pkg = getPackage(explicitPkgId);
  if (pkg.status !== 'APPROVED') {
    return res.status(400).json({
      error: 'Bài giảng phải ở trạng thái APPROVED mới có thể KHÓA (LOCK) để bước vào chế độ giảng dạy.'
    });
  }

  pkg.status = 'LOCKED';
  pkg.metadata.lockedAt = new Date().toISOString();
  pkg.metadata.lockedBy = 'Giảng viên Chủ nhiệm học phần';

  res.json({ success: true, status: 'LOCKED', lecturePackage: pkg });
});

// Synthesize Audio (TTS Gateway)
app.post('/api/tts/synthesize', async (req: Request, res: Response) => {
  try {
    const {
      text,
      packageId,
      teachingPointId,
      scriptId
    } = req.body;

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }
    if (!packageId || !teachingPointId) {
      return res.status(400).json({ error: 'packageId and teachingPointId are required for provenance' });
    }

    const audio = await synthesizeWithTtsGateway({
      text: text.trim(),
      packageId,
      teachingPointId,
      scriptId
    });

    return res.json({
      ...audio,
      audioSource: audio.provider,
      voiceStatus: 'LOCAL_VIENEUV3',
      voiceProfileId: audio.voiceProfile,
      ttsModel: audio.model,
      modelUsed: audio.model
    });
  } catch (err: any) {
    console.error('[TTS Gateway] Server error:', err);
    const message = err?.message || 'TTS synthesis failed';
    const status = message.includes('not configured') ? 503 : 502;
    return res.status(status).json({
      error: status === 503 ? 'VOICE_RUNTIME_NOT_CONFIGURED' : 'TTS_SYNTHESIS_FAILED',
      message
    });
  }
});

app.get('/api/tts/cache-status', (_req: Request, res: Response) => {
  res.json(getTtsCacheStats());
});

// Classroom Interaction / Student Question Handling
app.post('/api/interaction/ask', async (req: Request, res: Response) => {
  try {
    const { question, currentBlockId } = req.body;
    const currentPkg = getActivePackage();
    const block = currentPkg.teachingBlocks.find(b => b.id === currentBlockId) || currentPkg.teachingBlocks[0];

    // Source context
    const sourcesSummary = block.sources
      .map(s => `[${s.sourceId} (${s.sourceType})]: ${s.citation}`)
      .join('\n');

    let answer = '';
    let category = 'ON_TOPIC';
    let returnTransition = `Bây giờ chúng ta trở lại trọng tâm bài giảng: "${block.topic}".`;

    if (geminiClient) {
      try {
        const prompt = `You are a strict, authoritative university lecturer teaching from an approved syllabus.
Current Teaching Block: ${block.topic}
Pedagogical Purpose: ${block.purpose}
Approved Lecture Text: ${block.lectureText}
Authoritative Sources Attached:
${sourcesSummary}

Student Question: "${question}"

RULES:
1. Classify the question as one of: ON_TOPIC, RELATED, CLARIFICATION, APPLICATION, EXTENSION, OFF_TOPIC, UNSUPPORTED.
2. Ground your answer strictly in the approved materials. Never invent unverified facts.
3. If off-topic or unsupported, politely guide the student back to the current topic.
4. Provide a return transition back to the main lecture sequence.
Return JSON with { category, answer, returnTransition }.`;

        const aiRes = await geminiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        if (aiRes.text) {
          const parsed = JSON.parse(aiRes.text);
          answer = parsed.answer;
          category = parsed.category || 'ON_TOPIC';
          returnTransition = parsed.returnTransition || returnTransition;
        }
      } catch (aiErr) {
        console.warn('[Gemini Interaction] Fallback triggered:', aiErr);
      }
    }

    if (!answer) {
      // Deterministic pedagogical fallback
      const qLower = (question || '').toLowerCase();
      if (qLower.includes('khác gì') || qLower.includes('là gì')) {
        category = 'CLARIFICATION';
        answer = `Khái niệm trong "${block.topic}" được định nghĩa dựa trên Giáo trình Level 2: ${block.lectureText.slice(0, 180)}...`;
      } else if (qLower.includes('ứng dụng') || qLower.includes('thực tế')) {
        category = 'APPLICATION';
        answer = block.application || 'Ứng dụng trực tiếp trong bảo mật hạ tầng mạng phân tán.';
      } else {
        category = 'ON_TOPIC';
        answer = `Về vấn đề này, theo tài liệu nguồn được duyệt [${block.sources[0]?.sourceId}], chúng ta tập trung vào: ${block.keyPoints.join('; ')}.`;
      }
    }

    res.json({
      category,
      answer,
      returnTransition,
      blockId: block.id,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Interaction handling failed' });
  }
});

// -------------------------------------------------------------
// VITE SPA INTEGRATION & SERVER STARTUP
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Digital Lecturer Engine] Full-stack engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
