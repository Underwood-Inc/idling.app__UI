/**
 * Operating System Detection Utility
 * Detects user's OS to determine appropriate emoji set
 */

export type SupportedOS = 'windows' | 'mac' | 'unknown';

export interface OSInfo {
  os: SupportedOS;
  version?: string;
  userAgent: string;
  isSupported: boolean;
}

export class OSDetection {
  /**
   * Detect operating system from user agent (client-side)
   */
  static detectFromUserAgent(userAgent?: string): OSInfo {
    const ua =
      userAgent ||
      (typeof window !== 'undefined' ? window.navigator.userAgent : '');

    // Windows detection
    if (/Windows/i.test(ua)) {
      let version = 'unknown';

      // Windows version detection
      if (/Windows NT 10\.0/i.test(ua)) {
        version = '10/11';
      } else if (/Windows NT 6\.3/i.test(ua)) {
        version = '8.1';
      } else if (/Windows NT 6\.2/i.test(ua)) {
        version = '8';
      } else if (/Windows NT 6\.1/i.test(ua)) {
        version = '7';
      }

      return {
        os: 'windows',
        version,
        userAgent: ua,
        isSupported: true
      };
    }

    // macOS detection
    if (/Mac OS X|macOS/i.test(ua)) {
      let version = 'unknown';

      // macOS version detection
      const macVersionMatch = ua.match(/Mac OS X (\d+)_(\d+)_?(\d+)?/i);
      if (macVersionMatch) {
        const major = parseInt(macVersionMatch[1]);
        const minor = parseInt(macVersionMatch[2]);
        const patch = macVersionMatch[3] ? parseInt(macVersionMatch[3]) : 0;

        if (major >= 13) {
          version = 'ventura+';
        } else if (major >= 12) {
          version = 'monterey';
        } else if (major >= 11) {
          version = 'big_sur';
        } else if (major >= 10 && minor >= 15) {
          version = 'catalina';
        } else if (major >= 10 && minor >= 14) {
          version = 'mojave';
        } else {
          version = 'legacy';
        }
      }

      return {
        os: 'mac',
        version,
        userAgent: ua,
        isSupported: true
      };
    }

    // iOS detection (treat as Mac for emoji compatibility)
    if (/iPhone|iPad|iPod/i.test(ua)) {
      let version = 'unknown';

      const iosVersionMatch = ua.match(/OS (\d+)_(\d+)_?(\d+)?/i);
      if (iosVersionMatch) {
        const major = parseInt(iosVersionMatch[1]);
        version = major >= 15 ? 'ios15+' : major >= 14 ? 'ios14' : 'legacy';
      }

      return {
        os: 'mac', // Use Mac emoji set for iOS
        version: `ios_${version}`,
        userAgent: ua,
        isSupported: true
      };
    }

    // Android detection (limited emoji support)
    if (/Android/i.test(ua)) {
      return {
        os: 'unknown',
        version: 'android',
        userAgent: ua,
        isSupported: false // Android has inconsistent emoji support
      };
    }

    // Linux and other Unix-like systems
    if (/Linux|Unix|X11/i.test(ua)) {
      return {
        os: 'unknown',
        version: 'linux',
        userAgent: ua,
        isSupported: false // Linux emoji support varies greatly
      };
    }

    return {
      os: 'unknown',
      version: 'unknown',
      userAgent: ua,
      isSupported: false
    };
  }

  /**
   * Detect operating system from request headers (server-side)
   */
  static detectFromHeaders(
    headers: Record<string, string | string[] | undefined>
  ): OSInfo {
    const userAgent = Array.isArray(headers['user-agent'])
      ? headers['user-agent'][0]
      : headers['user-agent'] || '';

    return this.detectFromUserAgent(userAgent);
  }

  /**
   * Get emoji table name based on OS
   */
  static getEmojiTableName(
    osInfo: OSInfo
  ): 'emojis_windows' | 'emojis_mac' | null {
    if (!osInfo.isSupported) {
      return null;
    }

    switch (osInfo.os) {
      case 'windows':
        return 'emojis_windows';
      case 'mac':
        return 'emojis_mac';
      default:
        return null;
    }
  }

  /**
   * Check if OS supports specific emoji features
   */
  static getEmojiSupport(osInfo: OSInfo): {
    supportsUnicode: boolean;
    supportsCustom: boolean;
    maxEmojiVersion: string;
    recommendedFormat: 'unicode' | 'image';
  } {
    switch (osInfo.os) {
      case 'windows':
        return {
          supportsUnicode: true,
          supportsCustom: true,
          maxEmojiVersion: this.getWindowsEmojiVersion(osInfo.version),
          recommendedFormat: 'unicode'
        };

      case 'mac':
        return {
          supportsUnicode: true,
          supportsCustom: true,
          maxEmojiVersion: this.getMacEmojiVersion(osInfo.version),
          recommendedFormat: 'unicode'
        };

      default:
        return {
          supportsUnicode: false,
          supportsCustom: true,
          maxEmojiVersion: '1.0',
          recommendedFormat: 'image'
        };
    }
  }

  /**
   * Get Windows emoji version support
   */
  private static getWindowsEmojiVersion(version?: string): string {
    switch (version) {
      case '10/11':
        return '14.0'; // Latest emoji support
      case '8.1':
      case '8':
        return '1.0'; // Basic emoji support
      case '7':
        return '0.6'; // Very limited support
      default:
        return '1.0';
    }
  }

  /**
   * Get macOS emoji version support
   */
  private static getMacEmojiVersion(version?: string): string {
    if (version?.startsWith('ios_')) {
      const iosVersion = version.replace('ios_', '');
      switch (iosVersion) {
        case 'ios15+':
          return '14.0';
        case 'ios14':
          return '13.1';
        default:
          return '12.0';
      }
    }

    switch (version) {
      case 'ventura+':
        return '15.0'; // Latest emoji support
      case 'monterey':
        return '14.0';
      case 'big_sur':
        return '13.1';
      case 'catalina':
        return '12.1';
      case 'mojave':
        return '11.0';
      default:
        return '5.0'; // Legacy support
    }
  }

  /**
   * Client-side hook for React components
   */
  static useOSDetection(): OSInfo {
    if (typeof window === 'undefined') {
      return {
        os: 'unknown',
        userAgent: '',
        isSupported: false
      };
    }

    return this.detectFromUserAgent();
  }

  /**
   * Validate if emoji is supported on current OS
   */
  static isEmojiSupported(emojiVersion: string, osInfo: OSInfo): boolean {
    const support = this.getEmojiSupport(osInfo);

    // Simple version comparison (you might want a more sophisticated comparison)
    const supportedVersion = parseFloat(support.maxEmojiVersion);
    const requiredVersion = parseFloat(emojiVersion);

    return supportedVersion >= requiredVersion;
  }

  /**
   * Get fallback emoji recommendations
   */
  static getFallbackEmojis(osInfo: OSInfo): string[] {
    const support = this.getEmojiSupport(osInfo);

    if (!support.supportsUnicode) {
      // Return text-based alternatives
      return [':)', ':(', ':D', ':P', '<3', ':|', ':o'];
    }

    // Return basic Unicode emojis that work across all platforms
    return ['😀', '😢', '😍', '😂', '👍', '👎', '❤️', '🔥'];
  }
}

/**
 * Server-side middleware helper
 */
export function getOSFromRequest(req: {
  headers: Record<string, string | string[] | undefined>;
}): OSInfo {
  return OSDetection.detectFromHeaders(req.headers);
}

/**
 * Client-side React hook
 */
export function useOSDetection(): OSInfo {
  return OSDetection.useOSDetection();
}
