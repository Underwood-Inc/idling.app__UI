import { adventurer } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { AspectRatioConfig, AvatarPositioning } from '../types';

export class AvatarService {
  /**
   * Generate avatar SVG using DiceBear
   */
  generateAvatar(seed: string): string {
    const avatar = createAvatar(adventurer, { seed });
    return avatar.toString();
  }

  /**
   * Calculate avatar positioning based on aspect ratio and configuration
   */
  calculateAvatarPositioning(
    config: AspectRatioConfig,
    aspectRatio: string
  ): AvatarPositioning {
    const { width, height, avatarX, avatarY, avatarSize } = config;
    
    let adjustedAvatarX = avatarX;
    let adjustedAvatarY = avatarY;
    let adjustedAvatarSize = avatarSize;

    // Handle narrow formats first (height-based check)
    if (height < 500 && aspectRatio !== 'linkedin-banner') {
      // Other short formats (Twitter header, etc.) - generic narrow format handling
      adjustedAvatarSize = Math.min(avatarSize, height * 0.6, width * 0.18);
      adjustedAvatarY = Math.max(10, (height - adjustedAvatarSize) * 0.1);
      adjustedAvatarX = (width - adjustedAvatarSize) * 0.12;
    } else {
      // Handle specific aspect ratios
      switch (aspectRatio) {
        case 'square':
          // For square format, optimize for centralized composition
          adjustedAvatarSize = Math.min(avatarSize, width * 0.52, height * 0.48);
          adjustedAvatarY = Math.max(avatarY, height * 0.1);
          adjustedAvatarX = (width - adjustedAvatarSize) / 2;
          break;

        case '4-3':
          // For 4:3 format, use more vertical space
          adjustedAvatarSize = Math.min(avatarSize, width * 0.45, height * 0.5);
          adjustedAvatarY = Math.max(avatarY, height * 0.08);
          adjustedAvatarX = (width - adjustedAvatarSize) / 2;
          break;

        case 'youtube':
          // For YouTube 16:9 format, optimize for wider canvas
          adjustedAvatarSize = Math.min(avatarSize, width * 0.36, height * 0.6);
          adjustedAvatarY = Math.max(avatarY, height * 0.08);
          adjustedAvatarX = (width - adjustedAvatarSize) / 2;
          break;

        case 'facebook-cover':
          // For Facebook cover, similar to default but slightly optimized
          adjustedAvatarSize = Math.min(avatarSize, width * 0.44, height * 0.75);
          adjustedAvatarY = Math.max(avatarY, height * 0.06);
          adjustedAvatarX = (width - adjustedAvatarSize) / 2;
          break;

        case 'twitter-header':
          // For Twitter header, wide format optimization
          adjustedAvatarSize = Math.min(avatarSize, width * 0.28, height * 0.75);
          adjustedAvatarY = Math.max(avatarY, height * 0.12);
          adjustedAvatarX = (width - adjustedAvatarSize) / 2;
          break;

        case 'linkedin-banner':
          // For LinkedIn banner, wide format optimization
          adjustedAvatarSize = Math.min(avatarSize, height * 0.4, width * 0.12);
          adjustedAvatarY = Math.max(avatarY, height * 0.05);
          adjustedAvatarX = (width - adjustedAvatarSize) / 2;
          break;

        default:
          // Default positioning for other formats
          adjustedAvatarSize = Math.min(avatarSize, width * 0.4, height * 0.7);
          adjustedAvatarY = Math.max(20, avatarY);
          adjustedAvatarX = (width - adjustedAvatarSize) / 2;
          break;
      }
    }

    // Ensure avatar doesn't go off-screen
    adjustedAvatarX = Math.max(
      20,
      Math.min(adjustedAvatarX, width - adjustedAvatarSize - 20)
    );
    adjustedAvatarY = Math.max(
      20,
      Math.min(adjustedAvatarY, height - adjustedAvatarSize - 20)
    );

    return {
      x: adjustedAvatarX,
      y: adjustedAvatarY,
      size: adjustedAvatarSize
    };
  }
} 