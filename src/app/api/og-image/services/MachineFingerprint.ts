import crypto from 'crypto';
import { NextRequest } from 'next/server';

export interface MachineFingerprint {
  fingerprintId: string;
  ipAddress: string;
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  platform: string;
  timezone: string;
  screenResolution: string;
}

export interface FingerprintComponents {
  ipHash: string;
  userAgentCore: string;
  browserFamily: string;
  osFamily: string;
  languageGroup: string;
  timezoneGroup: string;
  networkClass: string;
}

export class MachineFingerprintService {
  /**
   * Generate multiple fingerprint components for fuzzy matching
   * This creates overlapping identifiers that are harder to bypass
   */
  static generateFingerprint(request: NextRequest, clientData?: {
    timezone?: string;
    screenResolution?: string;
    platform?: string;
  }): MachineFingerprint & { components: FingerprintComponents } {
    const ipAddress = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const acceptLanguage = request.headers.get('accept-language') || 'unknown';
    const acceptEncoding = request.headers.get('accept-encoding') || 'unknown';
    
    // Use client-provided data or fallback to header data
    const platform = clientData?.platform || this.extractPlatformFromUserAgent(userAgent);
    const timezone = clientData?.timezone || 'unknown';
    const screenResolution = clientData?.screenResolution || 'unknown';

    // Generate fuzzy matching components
    const components = this.generateFingerprintComponents(
      ipAddress, userAgent, acceptLanguage, timezone, platform
    );

    // Create main fingerprint hash from stable components
    const fingerprintData = [
      components.ipHash,
      components.userAgentCore,
      components.browserFamily,
      components.osFamily,
      components.languageGroup,
      components.timezoneGroup
    ].join('|');

    const fingerprintId = crypto
      .createHash('sha256')
      .update(fingerprintData)
      .digest('hex')
      .substring(0, 16); // Use first 16 chars for readability

    return {
      fingerprintId,
      ipAddress,
      userAgent,
      acceptLanguage,
      acceptEncoding,
      platform,
      timezone,
      screenResolution,
      components
    };
  }

  /**
   * Generate fuzzy fingerprint components for overlapping detection
   */
  private static generateFingerprintComponents(
    ipAddress: string,
    userAgent: string,
    acceptLanguage: string,
    timezone: string,
    platform: string
  ): FingerprintComponents {
    // IP-based hash (handles dynamic IPs within same ISP/location)
    const ipParts = ipAddress.split('.');
    const ipNetwork = ipParts.length >= 3 ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}` : ipAddress;
    const ipHash = crypto.createHash('md5').update(ipNetwork).digest('hex').substring(0, 8);

    // User agent core (stable across minor version updates)
    const userAgentCore = this.extractUserAgentCore(userAgent);
    
    // Browser family (Chrome, Firefox, Safari, etc.)
    const browserFamily = this.extractBrowserFamily(userAgent);
    
    // OS family (Windows, macOS, Linux, etc.)
    const osFamily = this.extractOSFamily(userAgent, platform);
    
    // Language group (en, es, fr, etc. - ignore region variants)
    const languageGroup = acceptLanguage.split(',')[0]?.split('-')[0] || 'unknown';
    
    // Timezone group (group by UTC offset ranges)
    const timezoneGroup = this.getTimezoneGroup(timezone);
    
    // Network class (based on IP range patterns)
    const networkClass = this.getNetworkClass(ipAddress);

    return {
      ipHash,
      userAgentCore,
      browserFamily,
      osFamily,
      languageGroup,
      timezoneGroup,
      networkClass
    };
  }

  /**
   * Check if two fingerprints are likely from the same machine using fuzzy matching
   */
  static calculateSimilarity(fp1: FingerprintComponents, fp2: FingerprintComponents): number {
    let score = 0;
    let maxScore = 0;

    // IP network similarity (high weight)
    maxScore += 30;
    if (fp1.ipHash === fp2.ipHash) score += 30;
    
    // User agent core similarity (high weight)
    maxScore += 25;
    if (fp1.userAgentCore === fp2.userAgentCore) score += 25;
    
    // Browser family (medium weight)
    maxScore += 15;
    if (fp1.browserFamily === fp2.browserFamily) score += 15;
    
    // OS family (medium weight)
    maxScore += 15;
    if (fp1.osFamily === fp2.osFamily) score += 15;
    
    // Language group (low weight)
    maxScore += 8;
    if (fp1.languageGroup === fp2.languageGroup) score += 8;
    
    // Timezone group (low weight)
    maxScore += 4;
    if (fp1.timezoneGroup === fp2.timezoneGroup) score += 4;
    
    // Network class (low weight)
    maxScore += 3;
    if (fp1.networkClass === fp2.networkClass) score += 3;

    return (score / maxScore) * 100;
  }

  /**
   * Get client IP address from request headers
   */
  private static getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    );
  }

  /**
   * Extract platform information from user agent
   */
  private static extractPlatformFromUserAgent(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('windows')) return 'windows';
    if (ua.includes('macintosh') || ua.includes('mac os')) return 'macos';
    if (ua.includes('linux')) return 'linux';
    if (ua.includes('android')) return 'android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
    
    return 'unknown';
  }

  /**
   * Extract stable user agent core (remove version numbers that change frequently)
   */
  private static extractUserAgentCore(userAgent: string): string {
    return userAgent
      .replace(/\d+\.\d+(\.\d+)?/g, 'X.X') // Replace version numbers
      .replace(/\s+/g, ' ') // Normalize spaces
      .substring(0, 100); // Limit length
  }

  /**
   * Extract browser family from user agent
   */
  private static extractBrowserFamily(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('chrome') && !ua.includes('edge')) return 'chrome';
    if (ua.includes('firefox')) return 'firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
    if (ua.includes('edge')) return 'edge';
    if (ua.includes('opera')) return 'opera';
    
    return 'unknown';
  }

  /**
   * Extract OS family from user agent and platform
   */
  private static extractOSFamily(userAgent: string, platform: string): string {
    const ua = userAgent.toLowerCase();
    const p = platform.toLowerCase();
    
    if (ua.includes('windows') || p.includes('windows')) return 'windows';
    if (ua.includes('mac') || p.includes('macos')) return 'macos';
    if (ua.includes('linux') || p.includes('linux')) return 'linux';
    if (ua.includes('android') || p.includes('android')) return 'android';
    if (ua.includes('ios') || p.includes('ios')) return 'ios';
    
    return 'unknown';
  }

  /**
   * Group timezones by UTC offset ranges
   */
  private static getTimezoneGroup(timezone: string): string {
    if (timezone === 'unknown') return 'unknown';
    
    // Extract UTC offset if present
    const offsetMatch = timezone.match(/UTC([+-]\d+)/);
    if (offsetMatch) {
      const offset = parseInt(offsetMatch[1]);
      if (offset >= -12 && offset <= -8) return 'americas-west';
      if (offset >= -7 && offset <= -4) return 'americas-east';
      if (offset >= -3 && offset <= 2) return 'europe-africa';
      if (offset >= 3 && offset <= 8) return 'asia-west';
      if (offset >= 9 && offset <= 12) return 'asia-east';
    }
    
    return 'unknown';
  }

  /**
   * Classify network type based on IP patterns
   */
  private static getNetworkClass(ipAddress: string): string {
    if (ipAddress === 'unknown') return 'unknown';
    
    const parts = ipAddress.split('.');
    if (parts.length !== 4) return 'unknown';
    
    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);
    
    // Private networks
    if (first === 192 && second === 168) return 'private-192';
    if (first === 10) return 'private-10';
    if (first === 172 && second >= 16 && second <= 31) return 'private-172';
    
    // Common ISP ranges (simplified)
    if (first >= 1 && first <= 126) return 'class-a';
    if (first >= 128 && first <= 191) return 'class-b';
    if (first >= 192 && first <= 223) return 'class-c';
    
    return 'unknown';
  }

  /**
   * Validate that a fingerprint is reasonable (not obviously spoofed)
   */
  static validateFingerprint(fingerprint: MachineFingerprint): boolean {
    // Basic validation - ensure critical fields are present
    if (!fingerprint.ipAddress || fingerprint.ipAddress === 'unknown') return false;
    if (!fingerprint.userAgent || fingerprint.userAgent === 'unknown') return false;
    if (!fingerprint.fingerprintId || fingerprint.fingerprintId.length < 8) return false;
    
    return true;
  }
} 