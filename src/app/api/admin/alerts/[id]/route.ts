import { auth } from '@lib/auth';
import sql from '@lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ================================
// VALIDATION SCHEMAS
// ================================

const UpdateAlertSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .optional(),
  message: z.string().optional(),
  details: z.string().optional(),
  alert_type: z
    .enum(['info', 'warning', 'error', 'success', 'maintenance', 'custom'])
    .optional(),
  priority: z.number().int().min(-100).max(100).optional(),
  icon: z.string().optional(),
  dismissible: z.boolean().optional(),
  persistent: z.boolean().optional(),
  expires_at: z.string().datetime().optional(),
  target_audience: z
    .enum([
      'all',
      'authenticated',
      'subscribers',
      'admins',
      'role_based',
      'specific_users'
    ])
    .optional(),
  target_roles: z.array(z.string()).optional(),
  target_users: z.array(z.number().int()).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  is_active: z.boolean().optional(),
  is_published: z.boolean().optional(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await validateAdminAccess(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const alertId = parseInt(params.id);
    if (isNaN(alertId)) {
      return NextResponse.json({ error: 'Invalid alert ID' }, { status: 400 });
    }

    const [alert] = await sql`
      SELECT * FROM custom_alerts WHERE id = ${alertId}
    `;

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await validateAdminAccess(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const alertId = parseInt(params.id);
    if (isNaN(alertId)) {
      return NextResponse.json({ error: 'Invalid alert ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = UpdateAlertSchema.parse(body);

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (
          key === 'target_roles' ||
          key === 'target_users' ||
          key === 'actions' ||
          key === 'metadata'
        ) {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(value);
        }
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add updated_by and updated_at
    updateFields.push(
      `updated_by = $${paramIndex}`,
      `updated_at = CURRENT_TIMESTAMP`
    );
    updateValues.push(session.user.id);

    const query = `
      UPDATE custom_alerts 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex + 1}
      RETURNING *
    `;
    updateValues.push(alertId);

    const [updatedAlert] = await sql.unsafe(query, updateValues);

    if (!updatedAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // SSE notifications removed - admin panel now uses polling for updates

    return NextResponse.json({
      message: 'Alert updated successfully',
      alert: updatedAlert
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await validateAdminAccess(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const alertId = parseInt(params.id);
    if (isNaN(alertId)) {
      return NextResponse.json({ error: 'Invalid alert ID' }, { status: 400 });
    }

    const [deletedAlert] = await sql`
      DELETE FROM custom_alerts 
      WHERE id = ${alertId}
      RETURNING *
    `;

    if (!deletedAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // SSE notifications removed - admin panel now uses polling for updates

    return NextResponse.json({
      message: 'Alert deleted successfully',
      alert: deletedAlert
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    );
  }
}
