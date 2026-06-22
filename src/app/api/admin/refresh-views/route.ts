import { materializedViewRefresher } from '@lib/cron/refresh-materialized-views';
import { PERMISSIONS } from '@lib/permissions/permissions';
import { requireAdminApiAccess } from '@lib/security/requireAdminApiAccess';
import { serverLogger } from '@lib/utils/server-logger';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for managing materialized view refreshes
 * GET: Get refresh status
 * POST: Force refresh of materialized views
 */

export async function GET() {
  try {
    const access = await requireAdminApiAccess(PERMISSIONS.ADMIN.ACCESS);
    if (!access.granted) {
      return access.response;
    }

    const status = materializedViewRefresher.getStatus();

    return NextResponse.json({
      success: true,
      data: {
        status,
        timestamp: new Date().toISOString(),
        message: 'Materialized view refresh status retrieved successfully'
      }
    });
  } catch (error) {
    serverLogger.error('Failed to get materialized view status', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve materialized view status'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminApiAccess(PERMISSIONS.ADMIN.ACCESS);
    if (!access.granted) {
      return access.response;
    }

    const body = await request.json().catch(() => ({}));
    const { jobId } = body;

    await materializedViewRefresher.forceRefresh(jobId);

    const status = materializedViewRefresher.getStatus();

    return NextResponse.json({
      success: true,
      data: {
        message: jobId
          ? `Materialized view '${jobId}' refreshed successfully`
          : 'All materialized views refreshed successfully',
        status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    serverLogger.error('Failed to refresh materialized views', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh materialized views'
      },
      { status: 500 }
    );
  }
}
