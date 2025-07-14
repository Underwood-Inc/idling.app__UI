'use server';

import { cache } from 'react';
import { z } from 'zod';
import sql from '../../lib/db';

// Zod schema for aspect ratio options
const AspectRatioSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  width: z.number(),
  height: z.number(),
  dimensions: z.string()
});

export type AspectRatioOption = z.infer<typeof AspectRatioSchema>;

// Response schema
const FormOptionsResponseSchema = z.object({
  aspect_ratios: z.array(AspectRatioSchema)
});

export type FormOptionsResponse = z.infer<typeof FormOptionsResponseSchema>;

// Database row type
interface AspectRatioRow {
  key: string;
  name: string;
  description: string;
  width: number;
  height: number;
  sort_order: number;
}

/**
 * Server action to get form options using proper relational columns
 */
export const getFormOptions = cache(async (): Promise<FormOptionsResponse> => {
  try {
    // Get aspect ratios using proper WIDTH and HEIGHT columns
    const aspectRatiosResult = await sql<AspectRatioRow[]>`
      SELECT key, name, description, width, height, sort_order
      FROM form_options
      WHERE category = 'aspect_ratios' AND is_active = TRUE
      ORDER BY sort_order ASC
    `;

    // Transform the data using proper columns
    const aspectRatios: AspectRatioOption[] = aspectRatiosResult.map(
      (row: AspectRatioRow) => ({
        key: row.key,
        name: row.name,
        description: row.description,
        width: row.width,
        height: row.height,
        dimensions: `${row.width}×${row.height}`
      })
    );

    // Validate the response
    const response = FormOptionsResponseSchema.parse({
      aspect_ratios: aspectRatios
    });

    return response;
  } catch (error) {
    console.error('Error fetching form options:', error);
    throw new Error('Failed to fetch form options');
  }
});

/**
 * Server action to get aspect ratios only
 */
export const getAspectRatios = cache(async (): Promise<AspectRatioOption[]> => {
  const options = await getFormOptions();
  return options.aspect_ratios;
});
