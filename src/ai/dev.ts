'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-image.ts';
import '@/ai/flows/generate-image-description.ts';
import '@/ai/flows/find-products.ts';
