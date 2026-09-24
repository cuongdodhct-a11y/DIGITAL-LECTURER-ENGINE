/**
 * Digital Lecturer Engine - Source JSON Schema Definition
 */

export const SOURCE_SCHEMA = {
  $id: 'https://digital-lecturer.internal/schemas/source.json',
  type: 'object',
  required: [
    'sourceId',
    'filename',
    'documentType',
    'sourceLevel',
    'title',
    'status',
    'extractedText',
    'metadata'
  ],
  properties: {
    sourceId: { type: 'string', pattern: '^SRC-[0-9]{3,}$' },
    filename: { type: 'string', minLength: 1 },
    documentType: { enum: ['DOCX', 'PPTX', 'PDF', 'TXT', 'MARKDOWN'] },
    sourceLevel: { type: 'integer', minimum: 1, maximum: 7 },
    title: { type: 'string', minLength: 2 },
    author: { type: 'string' },
    year: { type: ['string', 'number'] },
    publisher: { type: 'string' },
    pageCount: { type: 'integer', minimum: 0 },
    slideCount: { type: 'integer', minimum: 0 },
    status: { enum: ['UPLOADED', 'EXTRACTED', 'REGISTERED', 'ERROR'] },
    extractedText: { type: 'string' },
    metadata: {
      type: 'object',
      required: ['fileSize', 'extractedAt'],
      properties: {
        fileSize: { type: 'number' },
        mimeType: { type: 'string' },
        extractedAt: { type: 'string' },
        checksum: { type: 'string' }
      }
    }
  }
};
