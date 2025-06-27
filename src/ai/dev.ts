'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-image.ts';
import '@/ai/flows/generate-image-description.ts';
import '@/ai/flows/find-products.ts';
import '@/ai/flows/solve-homework.ts';
import '@/ai/flows/identify-object.ts';
import '@/ai/flows/extract-text.ts';
