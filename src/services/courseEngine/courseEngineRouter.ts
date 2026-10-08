import { Router, Request, Response } from 'express';
import { COURSE_1MD_ID, getCourse, getLessonPackage, listCourses } from './courseRegistry';
import { assertLessonBelongsToCourse } from './packageResolver';
import { registerAndBuildPilotPackage, PackageBuildMapping } from './packageBuildService';
import { verifySourceOnboarding } from './sourceOnboardingService';
import { verifyLecturePackage } from './lecturePackageService';
import { verifyGroundedScript, loadGroundedScript } from './groundedScriptService';
import { verifyTtsAudioGate } from './ttsAudioGateService';
import { synthesizeWithTtsGateway, getTtsCacheStats } from './ttsGatewayService';
import { RegisteredDocument } from '../../types/source';

export const courseEngineRouter = Router();

courseEngineRouter.get('/courses', (_req: Request, res: Response) => {
  res.json({ courses: listCourses() });
});

courseEngineRouter.get('/courses/:courseId', (req: Request, res: Response) => {
  const course = getCourse(req.params.courseId);
  if (!course) return res.status(404).json({ error: 'Course không tồn tại.' });
  res.json({ course });
});

courseEngineRouter.get('/courses/:courseId/packages', (req: Request, res: Response) => {
  const course = getCourse(req.params.courseId);
  if (!course) return res.status(404).json({ error: 'Course không tồn tại.' });
  res.json({ courseId: course.courseId, packages: course.packages });
});

courseEngineRouter.get('/courses/:courseId/packages/:lessonNumber', (req: Request, res: Response) => {
  const lessonNumber = Number(req.params.lessonNumber);
  const pkg = getLessonPackage(req.params.courseId, lessonNumber);
  if (!pkg) return res.status(404).json({ error: 'Bài giảng không tồn tại trong course.' });
  res.json({ package: pkg });
});

courseEngineRouter.get('/resolve/:courseId/:packageId', (req: Request, res: Response) => {
  try {
    const pkg = assertLessonBelongsToCourse(req.params.courseId, req.params.packageId);
    res.json({ package: pkg });
  } catch (error: any) {
    res.status(404).json({ error: error.message || 'Package không thuộc course.' });
  }
});

courseEngineRouter.get('/packages/:packageId/onboarding-status', (req: Request, res: Response) => {
  try {
    const result = verifySourceOnboarding(req.params.packageId);
    return res.json(result);
  } catch (error: any) {
    return res.status(404).json({ error: error.message || 'Không thể kiểm tra Source Onboarding.' });
  }
});

courseEngineRouter.get('/packages/:packageId/lecture-package-status', (req: Request, res: Response) => {
  try {
    return res.json(verifyLecturePackage(req.params.packageId));
  } catch (error: any) {
    return res.status(404).json({ error: error.message || 'Không thể kiểm tra Lecture Package.' });
  }
});

courseEngineRouter.get('/packages/:packageId/tts-audio-status', (req: Request, res: Response) => {
  try {
    return res.json(verifyTtsAudioGate(req.params.packageId));
  } catch (error: any) {
    return res.status(404).json({ error: error.message || 'Không thể kiểm tra Gate D TTS/Audio.' });
  }
});

courseEngineRouter.get('/tts/cache-status', (_req: Request, res: Response) => {
  return res.json(getTtsCacheStats());
});

courseEngineRouter.post('/packages/:packageId/tts/synthesize', async (req: Request, res: Response) => {
  try {
    const packageId = req.params.packageId;
    const script = loadGroundedScript(packageId);
    const { teachingPointId, text, scriptId } = req.body as { teachingPointId?: string; text?: string; scriptId?: string };
    const blocks = Array.isArray(script.teachingBlocks) ? script.teachingBlocks : [];
    const point = blocks.flatMap((b: any) => Array.isArray(b.teachingPoints) ? b.teachingPoints : []).find((p: any) => p.id === teachingPointId);
    if (!point) return res.status(404).json({ error: 'TeachingPoint không thuộc Grounded Script của package.' });
    if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'text là bắt buộc.' });
    if (text.trim() !== String(point.script).trim()) {
      return res.status(409).json({ error: 'TTS input phải đúng nguyên văn TeachingPoint script đã được grounded.' });
    }
    const gate = verifyTtsAudioGate(packageId);
    if (!gate.ready) return res.status(503).json({ error: 'GATE_D_NOT_READY', gate });
    const audio = await synthesizeWithTtsGateway({
      text: point.script,
      packageId,
      teachingPointId,
      scriptId
    });
    return res.json(audio);
  } catch (error: any) {
    return res.status(502).json({ error: error.message || 'TTS synthesis failed.' });
  }
});

courseEngineRouter.get('/packages/:packageId/grounded-script-status', (req: Request, res: Response) => {
  try {
    return res.json(verifyGroundedScript(req.params.packageId));
  } catch (error: any) {
    return res.status(404).json({ error: error.message || 'Không thể kiểm tra Grounded Script.' });
  }
});

courseEngineRouter.post('/packages/:packageId/build-pilot', (req: Request, res: Response) => {
  try {
    const { courseId, level1, level3, mapping } = req.body as {
      courseId?: string;
      level1?: RegisteredDocument;
      level3?: RegisteredDocument;
      mapping?: PackageBuildMapping[];
    };

    if (!courseId || !level1 || !level3 || !Array.isArray(mapping)) {
      return res.status(400).json({ error: 'courseId, level1, level3 và mapping là bắt buộc.' });
    }

    const artifact = registerAndBuildPilotPackage({
      courseId,
      packageId: req.params.packageId,
      level1,
      level3,
      mapping
    });

    const descriptor = getLessonPackage(courseId, artifact.lessonNumber);
    if (descriptor) {
      descriptor.status = 'READY_FOR_QC';
      descriptor.sourceSlots.level1 = {
        ...descriptor.sourceSlots.level1,
        sourceId: artifact.sourceRefs.find(source => source.level === 1)?.sourceId,
        filename: artifact.sourceRefs.find(source => source.level === 1)?.filename,
        status: 'REGISTERED'
      };
      descriptor.sourceSlots.level3 = {
        ...descriptor.sourceSlots.level3,
        sourceId: artifact.sourceRefs.find(source => source.level === 3)?.sourceId,
        filename: artifact.sourceRefs.find(source => source.level === 3)?.filename,
        status: 'REGISTERED'
      };
    }

    return res.json({ success: true, package: artifact });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Không thể xây dựng package.' });
  }
});

courseEngineRouter.get('/health', (_req: Request, res: Response) => {
  const course = getCourse(COURSE_1MD_ID)!;
  res.json({ ok: true, courseId: course.courseId, packageCount: course.packages.length, phase: 3, gate: 'A_SOURCE_ONBOARDING' });
});
