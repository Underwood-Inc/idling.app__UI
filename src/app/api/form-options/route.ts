import sql from '@lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Cache for form options to reduce database calls
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let cachedOptions: Map<string, { data: any; timestamp: number }> = new Map();

// Zod validation schemas
const FormOptionSchema = z.object({
  id: z.number(),
  category: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  sort_order: z.number(),
  is_active: z.boolean(),
  configuration: z.any(), // JSON object
  created_at: z.string(),
  updated_at: z.string()
});

const CreateFormOptionSchema = z.object({
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must be 50 characters or less'),
  key: z
    .string()
    .min(1, 'Key is required')
    .max(100, 'Key must be 100 characters or less'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional(),
  sort_order: z.number().int().min(0).max(9999).optional().default(0),
  configuration: z.record(z.any()).optional().nullable(),
  is_active: z.boolean().optional().default(true)
});

const GetFormOptionsQuerySchema = z.object({
  category: z.string().min(1).max(50).optional()
});

const DeleteFormOptionQuerySchema = z.object({
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must be 50 characters or less'),
  key: z
    .string()
    .min(1, 'Key is required')
    .max(100, 'Key must be 100 characters or less')
});

export interface FormOption {
  id: number;
  category: string;
  key: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  configuration: any;
  created_at: string;
  updated_at: string;
}

export interface FormOptionsResponse {
  success: boolean;
  data?: Record<string, FormOption[]>;
  error?: string;
  cached?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryValidation = GetFormOptionsQuerySchema.safeParse({
      category: searchParams.get('category') || undefined
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: queryValidation.error.errors
        },
        { status: 400 }
      );
    }

    const { category } = queryValidation.data;
    const cacheKey = category || 'all';

    // Check cache first
    const cached = cachedOptions.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true
      });
    }

    let result: FormOption[];

    if (category) {
      // Fetch specific category
      result = await sql<FormOption[]>`
        SELECT 
          id,
          category,
          key,
          name,
          description,
          sort_order,
          is_active,
          configuration,
          created_at,
          updated_at
        FROM form_options 
        WHERE category = ${category} AND is_active = TRUE
        ORDER BY sort_order, name
      `;
    } else {
      // Fetch all categories
      result = await sql<FormOption[]>`
        SELECT 
          id,
          category,
          key,
          name,
          description,
          sort_order,
          is_active,
          configuration,
          created_at,
          updated_at
        FROM form_options 
        WHERE is_active = TRUE
        ORDER BY category, sort_order, name
      `;
    }

    if (category) {
      // Return array for specific category
      const options = result.map((row) => ({
        ...row,
        configuration:
          typeof row.configuration === 'string'
            ? JSON.parse(row.configuration)
            : row.configuration
      }));

      // Cache the result
      cachedOptions.set(cacheKey, {
        data: options,
        timestamp: Date.now()
      });

      return NextResponse.json({
        success: true,
        data: options,
        cached: false
      });
    } else {
      // Return object grouped by category
      const groupedOptions: Record<string, FormOption[]> = {};

      for (const row of result) {
        const option = {
          ...row,
          configuration:
            typeof row.configuration === 'string'
              ? JSON.parse(row.configuration)
              : row.configuration
        };

        if (!groupedOptions[row.category]) {
          groupedOptions[row.category] = [];
        }
        groupedOptions[row.category].push(option);
      }

      // Cache the result
      cachedOptions.set(cacheKey, {
        data: groupedOptions,
        timestamp: Date.now()
      });

      return NextResponse.json({
        success: true,
        data: groupedOptions,
        cached: false
      });
    }
  } catch (error) {
    console.error('Error fetching form options:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch form options'
      },
      { status: 500 }
    );
  }
}

// Optional: Add POST endpoint for admin updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with zod
    const validation = CreateFormOptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const {
      category,
      key,
      name,
      description,
      sort_order,
      configuration,
      is_active
    } = validation.data;

    // Insert or update form option
    const result = await sql<FormOption[]>`
      INSERT INTO form_options (category, key, name, description, sort_order, configuration, is_active)
      VALUES (
        ${category}, 
        ${key}, 
        ${name}, 
        ${description || null}, 
        ${sort_order || 0}, 
        ${configuration ? JSON.stringify(configuration) : null}, 
        ${is_active !== undefined ? is_active : true}
      )
      ON CONFLICT (category, key) 
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        sort_order = EXCLUDED.sort_order,
        configuration = EXCLUDED.configuration,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    // Clear cache for this category
    cachedOptions.delete(category);
    cachedOptions.delete('all');

    return NextResponse.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error creating/updating form option:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create/update form option'
      },
      { status: 500 }
    );
  }
}

// Optional: Add DELETE endpoint for admin management
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryValidation = DeleteFormOptionQuerySchema.safeParse({
      category: searchParams.get('category'),
      key: searchParams.get('key')
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: queryValidation.error.errors
        },
        { status: 400 }
      );
    }

    const { category, key } = queryValidation.data;

    // Soft delete by setting is_active to false
    const result = await sql<FormOption[]>`
      UPDATE form_options 
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE category = ${category} AND key = ${key}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Form option not found'
        },
        { status: 404 }
      );
    }

    // Clear cache for this category
    cachedOptions.delete(category);
    cachedOptions.delete('all');

    return NextResponse.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error deleting form option:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete form option'
      },
      { status: 500 }
    );
  }
}

// Helper function to clear cache (for admin use)
function clearFormOptionsCache() {
  cachedOptions.clear();
  return { success: true, message: 'Cache cleared' };
}
