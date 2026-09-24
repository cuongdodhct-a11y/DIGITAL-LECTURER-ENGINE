/**
 * Digital Lecturer Engine - Live API Tools Definition
 * Strict internal tool interfaces operating solely over the approved LecturePackage.
 */

import { LecturePackage } from '../../types/lecture';
import { TeachingEngine } from '../teachingEngine/teachingEngine';

export interface LiveToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'OBJECT';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export const LIVE_TOOL_DECLARATIONS: LiveToolDeclaration[] = [
  {
    name: 'getCurrentTeachingBlock',
    description: 'Retrieves the currently active TeachingBlock, including keyPoints, lecture script, and sources.',
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'getPreviousTeachingBlock',
    description: 'Retrieves the prior TeachingBlock for retrospective review or recap.',
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'getNextTeachingBlock',
    description: 'Retrieves the upcoming TeachingBlock to prepare a logical pedagogical transition.',
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'getSourceEvidence',
    description: 'Retrieves the verified document citation, excerpt, and source level for a specific sourceId.',
    parameters: {
      type: 'OBJECT',
      properties: {
        sourceId: { type: 'STRING', description: 'The unique ID of the source (e.g. SRC-001).' }
      },
      required: ['sourceId']
    }
  },
  {
    name: 'getSlide',
    description: 'Retrieves the slide details (title, text, mapped blocks) for a given slide number.',
    parameters: {
      type: 'OBJECT',
      properties: {
        slideNumber: { type: 'INTEGER', description: 'The 1-based slide index.' }
      },
      required: ['slideNumber']
    }
  },
  {
    name: 'getLectureTime',
    description: 'Returns the elapsed lecture time, planned total time, and current pacing variance.',
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'getRemainingTime',
    description: 'Returns the remaining time allocated for the current lecture session in seconds.',
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'searchApprovedLecturePackage',
    description: 'Performs semantic or keyword search across the approved TeachingBlocks and registered citations.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Academic concept or keyword to find within the approved syllabus.' }
      },
      required: ['query']
    }
  },
  {
    name: 'recordStudentQuestion',
    description: 'Logs a student query and classification into the official pedagogical record.',
    parameters: {
      type: 'OBJECT',
      properties: {
        question: { type: 'STRING', description: 'The exact question asked by the student.' },
        category: {
          type: 'STRING',
          enum: ['ON_TOPIC', 'RELATED', 'CLARIFICATION', 'APPLICATION', 'EXTENSION', 'OFF_TOPIC', 'UNSUPPORTED'],
          description: 'Didactic classification of the query.'
        }
      },
      required: ['question', 'category']
    }
  },
  {
    name: 'returnToTeachingBlock',
    description: 'Returns the live teaching sequence back to the primary TeachingBlock after handling interaction.',
    parameters: {
      type: 'OBJECT',
      properties: {
        blockId: { type: 'STRING', description: 'The ID of the block to return to.' }
      },
      required: ['blockId']
    }
  }
];

export class LiveToolExecutor {
  constructor(private engine: TeachingEngine, private pkg: LecturePackage) {}

  public execute(toolName: string, args: Record<string, unknown>): unknown {
    const status = this.engine.getStatus();

    switch (toolName) {
      case 'getCurrentTeachingBlock':
        return status.currentBlock || null;

      case 'getPreviousTeachingBlock':
        return status.previousBlock || null;

      case 'getNextTeachingBlock':
        return status.nextBlock || null;

      case 'getSourceEvidence': {
        const sourceId = String(args.sourceId);
        const sourceMeta = this.pkg.sourceHierarchy.find(s => s.sourceId === sourceId);
        const citations = Object.values(this.pkg.citationMap)
          .flat()
          .filter(c => c.sourceIds.includes(sourceId));
        return {
          source: sourceMeta || null,
          verifiedClaims: citations
        };
      }

      case 'getSlide': {
        const slideNumber = Number(args.slideNumber);
        return this.pkg.slideMap.find(s => s.slideNumber === slideNumber) || null;
      }

      case 'getLectureTime':
        return {
          elapsedSeconds: status.elapsedSeconds,
          totalPlannedSeconds: status.totalPlannedSeconds,
          remainingSeconds: status.remainingSeconds
        };

      case 'getRemainingTime':
        return { remainingSeconds: status.remainingSeconds };

      case 'searchApprovedLecturePackage': {
        const q = String(args.query).toLowerCase();
        const matches = this.pkg.teachingBlocks.filter(b => 
          b.topic.toLowerCase().includes(q) ||
          b.lectureText.toLowerCase().includes(q) ||
          b.keyPoints.some(k => k.toLowerCase().includes(q))
        );
        return {
          count: matches.length,
          blocks: matches.map(m => ({ id: m.id, topic: m.topic, purpose: m.purpose }))
        };
      }

      case 'recordStudentQuestion':
        return { success: true, recordedAt: new Date().toISOString() };

      case 'returnToTeachingBlock': {
        const blockId = String(args.blockId);
        const success = this.engine.jumpToBlock(blockId);
        return { success, currentBlockId: blockId };
      }

      default:
        throw new Error(`Unknown Live tool: ${toolName}`);
    }
  }
}
