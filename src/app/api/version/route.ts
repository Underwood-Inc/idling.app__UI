import { NextResponse } from 'next/server';

export async function GET() {
  // Read version from package.json using require to avoid import warnings
  const packageJson = require('../../../../package.json');
  return NextResponse.json({ version: packageJson.version });
} 