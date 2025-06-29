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

    // For narrow formats, scale down avatar and ensure it fits
    if (height < 500) {
      adjustedAvatarSize = Math.min(avatarSize, height * 0.6, width * 0.2);
      adjustedAvatarY = Math.max(20, (height - adjustedAvatarSize) * 0.1);
      adjustedAvatarX = (width - adjustedAvatarSize) * 0.15; // Position in left area
    } else if (aspectRatio === 'square') {
      // For square format, use config values with minimal adjustments
      adjustedAvatarSize = Math.min(avatarSize, width * 0.5, height * 0.45);
      adjustedAvatarY = avatarY; // Use config value directly
      adjustedAvatarX = (width - adjustedAvatarSize) / 2; // Center horizontally
    } else {
      adjustedAvatarSize = Math.min(avatarSize, width * 0.4, height * 0.7);
      adjustedAvatarY = Math.max(20, avatarY);
      // Center the avatar horizontally
      adjustedAvatarX = (width - adjustedAvatarSize) / 2;
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