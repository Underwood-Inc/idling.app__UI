import { auth } from '@lib/auth';
import sql from '@lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ================================
// VALIDATION SCHEMAS
// ================================

const CreateAlertSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().optional(),
  details: z.string().optional(),
  alert_type: z.enum(['info', 'warning', 'error', 'success', 'maintenance', 'custom']),
  priority: z.number().int().min(-100).max(100).default(0),
  icon: z.string().optional(),
  dismissible: z.boolean().default(true),
  persistent: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_published: z.boolean().default(false),
  expires_at: z.string().datetime().optional(),
  target_audience: z.enum([
    'all', 'authenticated', 'subscribers', 'admins', 'role_based', 'specific_users'
  ]).default('all'),
  target_roles: z.array(z.string()).optional(),
  target_users: z.array(z.number().int()).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  actions: z.any().optional(),
  metadata: z.any().optional()
});

// ================================
// UTILITY FUNCTIONS
// ================================

async function validateAdminAccess(sessionUserId: string): Promise<boolean> {
  try {
    const adminCheck = await sql`
      SELECT ura.role_id, ur.name as role_name
      FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = ${sessionUserId}
      AND ur.name IN ('admin', 'moderator')
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
      LIMIT 1
    `;
    
    return adminCheck.length > 0;
  } catch (error) {
    console.error('Admin validation error:', error);
    return false;
  }
}

// ================================
// API HANDLERS
// ================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await validateAdminAccess(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const alerts = await sql`
      SELECT 
        id, title, message, details, alert_type, priority, icon,
        dismissible, persistent, expires_at, target_audience,
        target_roles, target_users, start_date, end_date,
        actions, metadata, is_active, is_published,
        created_at, updated_at, created_by
      FROM custom_alerts
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalCount = await sql`
      SELECT COUNT(*) as count FROM custom_alerts
    `;

    return NextResponse.json({
      alerts,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await validateAdminAccess(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = CreateAlertSchema.parse(body);

    const [newAlert] = await sql`
      INSERT INTO custom_alerts (
        title, message, details, alert_type, priority, icon,
        dismissible, persistent, is_active, is_published, expires_at, target_audience,
        target_roles, target_users, start_date, end_date,
        actions, metadata, created_by
      ) VALUES (
        ${validatedData.title},
        ${validatedData.message || null},
        ${validatedData.details || null},
        ${validatedData.alert_type},
        ${validatedData.priority},
        ${validatedData.icon || null},
        ${validatedData.dismissible},
        ${validatedData.persistent},
        ${validatedData.is_active},
        ${validatedData.is_published},
        ${validatedData.expires_at || null},
        ${validatedData.target_audience},
        ${JSON.stringify(validatedData.target_roles || [])},
        ${JSON.stringify(validatedData.target_users || [])},
        ${validatedData.start_date || null},
        ${validatedData.end_date || null},
        ${JSON.stringify(validatedData.actions || null)},
        ${JSON.stringify(validatedData.metadata || null)},
        ${session.user.id}
      ) RETURNING *
    `;

    // SSE notifications removed - admin panel now uses polling for updates

    return NextResponse.json({ 
      message: 'Alert created successfully', 
      alert: newAlert 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
} 