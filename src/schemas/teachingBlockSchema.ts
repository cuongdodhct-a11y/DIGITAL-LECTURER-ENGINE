/**
 * Digital Lecturer Engine - TeachingBlock JSON Schema Definition
 */

export const TEACHING_BLOCK_SCHEMA = {
  $id: 'https://digital-lecturer.internal/schemas/teachingBlock.json',
  type: 'object',
  required: [
    'id',
    'slideStart',
    'slideEnd',
    'topic',
    'purpose',
    'objectiveIds',
    'keyPoints',
    'lectureText',
    'pedagogicalMethod',
    'question',
    'waitSeconds',
    'expectedResponse',
    'example',
    'application',
    'transition',
    'durationSeconds',
    'sources',
    'contentType',
    'status'
  ],
  properties: {
    id: { type: 'string', pattern: '^TB-[0-9]{3,}$' },
    slideStart: { type: 'integer', minimum: 1 },
    slideEnd: { type: 'integer', minimum: 1 },
    topic: { type: 'string', minLength: 3 },
    purpose: { type: 'string', minLength: 5 },
    objectiveIds: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1
    },
    keyPoints: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1
    },
    lectureText: { type: 'string', minLength: 20 },
    pedagogicalMethod: { type: 'string' },
    question: { type: 'string' },
    waitSeconds: { type: 'integer', minimum: 0 },
    expectedResponse: { type: 'string' },
    example: { type: 'string' },
    application: { type: 'string' },
    transition: { type: 'string' },
    durationSeconds: { type: 'integer', minimum: 30 },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        required: ['sourceId', 'citation', 'confidence', 'contentType'],
        properties: {
          sourceId: { type: 'string' },
          citation: { type: 'string' },
          sourceType: { type: 'string' },
          pageOrSlide: { type: 'string' },
          confidence: { enum: ['HIGH', 'MEDIUM', 'LOW', 'UNSUPPORTED'] },
          contentType: {
            enum: [
              'CORE_CONTENT',
              'EXPLANATION',
              'EXAMPLE',
              'APPLICATION',
              'EXTENSION',
              'INFERENCE'
            ]
          },
          isUnsupported: { type: 'boolean' }
        }
      }
    },
    contentType: {
      enum: [
        'CORE_CONTENT',
        'EXPLANATION',
        'EXAMPLE',
        'APPLICATION',
        'EXTENSION',
        'INFERENCE'
      ]
    },
    status: { enum: ['DRAFT', 'READY', 'ACTIVE', 'FLAGGED', 'COMPLETED'] }
  }
};
