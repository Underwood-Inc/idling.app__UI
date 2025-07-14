import { NextResponse } from 'next/server';
import { withUniversalEnhancementsNoRateLimit } from '../../../lib/api/withUniversalEnhancements';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/version:
 *   get:
 *     summary: Get application version
 *     description: Returns the current version of the idling.app application
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Successfully retrieved version information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   description: The current application version
 *                   example: "0.338.7"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function versionHandler() {
  // Read version from package.json using require to avoid import warnings
  const packageJson = require('../../../../package.json');
  return NextResponse.json({ version: packageJson.version });
}

export const GET = withUniversalEnhancementsNoRateLimit(versionHandler);
