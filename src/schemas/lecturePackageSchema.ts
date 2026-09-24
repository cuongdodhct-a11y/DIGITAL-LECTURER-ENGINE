/**
 * Digital Lecturer Engine - LecturePackage Canonical JSON Schema Definition
 */

export const LECTURE_PACKAGE_SCHEMA = {
  $id: 'https://digital-lecturer.internal/schemas/lecturePackage.json',
  type: 'object',
  required: [
    'id',
    'version',
    'status',
    'metadata',
    'objectives',
    'requirements',
    'sourceHierarchy',
    'lectureStructure',
    'timingPlan',
    'slideMap',
    'teachingBlocks',
    'interactionPlan',
    'transitionPlan',
    'citationMap',
    'qualityControl',
    'unresolvedIssues'
  ],
  properties: {
    id: { type: 'string' },
    version: { type: 'integer', minimum: 1 },
    status: {
      enum: [
        'DRAFT',
        'ANALYZING',
        'QC_PENDING',
        'NEEDS_REVIEW',
        'APPROVED',
        'LOCKED',
        'TEACHING',
        'COMPLETED'
      ]
    },
    metadata: {
      type: 'object',
      required: [
        'courseCode',
        'courseTitle',
        'lectureNumber',
        'lectureTitle',
        'plannedDurationMinutes',
        'authorLecturer',
        'pedagogicalFocus',
        'createdAt'
      ]
    },
    objectives: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'code', 'statement', 'cognitiveLevel', 'mappedBlockIds']
      },
      minItems: 1
    },
    requirements: { type: 'array' },
    sourceHierarchy: { type: 'array', minItems: 1 },
    lectureStructure: { type: 'array', minItems: 1 },
    timingPlan: {
      type: 'object',
      required: ['totalPlannedSeconds', 'totalActualSeconds', 'blockTimings']
    },
    slideMap: { type: 'array', minItems: 1 },
    teachingBlocks: { type: 'array', minItems: 1 },
    interactionPlan: { type: 'array' },
    transitionPlan: { type: 'array' },
    citationMap: { type: 'object' },
    qualityControl: { type: 'object' },
    unresolvedIssues: { type: 'array' }
  }
};
