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