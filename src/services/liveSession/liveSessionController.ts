/**
 * Digital Lecturer Engine - Live Session Controller
 * Coordinates live voice sessions using gemini-3.8-live and gemini-3.8-live-extended-thinking.
 * Enforces rule: The Live layer does NOT own the lesson; it operates strictly under TeachingEngine.
 */

import { LiveModelType, LiveInteractionStatus, LiveSessionContext } from '../../types/live';
import { TeachingEngine } from '../teachingEngine/teachingEngine';
import { LiveToolExecutor, LIVE_TOOL_DECLARATIONS } from './liveTools';

export class LiveSessionController {
  private engine: TeachingEngine;
  private toolExecutor: LiveToolExecutor;
  private currentModel: LiveModelType = 'gemini-3.8-live';
  private interactionStatus: LiveInteractionStatus = 'IDLE';

  constructor(engine: TeachingEngine) {
    this.engine = engine;
    this.toolExecutor = new LiveToolExecutor(engine, engine.getPackage());
  }

  public getModel(): LiveModelType {
    return this.currentModel;
  }

  public setModel(model: LiveModelType): void {
    this.currentModel = model;
  }

  public getInteractionStatus(): LiveInteractionStatus {
    return this.interactionStatus;
  }

  public setInteractionStatus(status: LiveInteractionStatus): void {
    this.interactionStatus = status;
  }

  /**
   * Generates minimal contextual payload for Live API to avoid context flooding.
   */
  public generateSessionContext(): LiveSessionContext {
    const status = this.engine.getStatus();
    const pkg = this.engine.getPackage();

    return {
      courseCode: pkg.metadata.courseCode,
      courseTitle: pkg.metadata.courseTitle,
      lectureTitle: pkg.metadata.lectureTitle,
      currentBlockId: status.currentBlock?.id || 'TB-001',
      currentSlideNumber: status.currentSlide?.slideNumber || 1,
      elapsedSeconds: status.elapsedSeconds,
      remainingSeconds: status.remainingSeconds,
      pedagogicalFocus: status.lessonFocus,
      sourceContext: (status.currentBlock?.sources || [])
        .map(s => `[${s.sourceId}]: ${s.citation}`)
        .join('; ')
    };
  }

  public getToolDeclarations() {
    return LIVE_TOOL_DECLARATIONS;
  }

  public handleToolCall(toolName: string, args: Record<string, unknown>): unknown {
    return this.toolExecutor.execute(toolName, args);
  }
}
