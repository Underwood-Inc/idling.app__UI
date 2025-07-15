'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarPropSizes } from '../avatar/Avatar';
import { InteractiveTooltip } from '../tooltip/InteractiveTooltip';
import { AvatarDecoration } from './AvatarDecoration';
import './EnhancedAvatar.css';

export interface EnhancedAvatarProps {
  seed?: string;
  size?: AvatarPropSizes;
  userId?: string;
  enableTooltip?: boolean;
  tooltipScale?: 2 | 3 | 4;
  showDecorations?: boolean;
  className?: string;
}

const decorationOptions = [
  { value: '', label: 'None' },
  { value: 'enterprise-crown', label: '👑 Enterprise Crown' },
  { value: 'premium-galaxy', label: '🌌 Premium Galaxy' },
  { value: 'pro-plasma', label: '⚡ Pro Plasma' },
  { value: 'active-glow', label: '✨ Active Glow' },
  { value: 'trial-pulse', label: '🔄 Trial Pulse' }
];

export function EnhancedAvatar({
  seed,
  size = 'md',
  userId,
  enableTooltip = false,
  tooltipScale = 2,
  showDecorations = true,
  className = ''
}: EnhancedAvatarProps) {
  const [selectedDecoration, setSelectedDecoration] = useState<string>('');
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  const { data: session } = useSession();

  // Check if this is the user's own profile and if they have admin access
  useEffect(() => {
    const ownProfile = session?.user?.id?.toString() === userId?.toString();
    setIsOwnProfile(ownProfile);

    if (ownProfile) {
      // Check admin access
      const checkAdminAccess = async () => {
        try {
          const response = await fetch('/api/test/admin-check');
          if (response.ok) {
            const data = await response.json();
            setHasAdminAccess(data.hasAdminAccess);
          }
        } catch (error) {
          console.error('Error checking admin access:', error);
          setHasAdminAccess(false);
        }
      };
      checkAdminAccess();
    }
  }, [session, userId]);

  const avatarElement = (
    <Avatar
      seed={seed}
      size={size}
      enableTooltip={enableTooltip}
      tooltipScale={tooltipScale}
    />
  );

  const decoratedAvatar = showDecorations ? (
    <AvatarDecoration
      userId={userId}
      size={size}
      forceDecoration={selectedDecoration || undefined}
    >
      {avatarElement}
    </AvatarDecoration>
  ) : (
    avatarElement
  );

  // Admin controls content
  const adminControlsContent = (
    <div className="enhanced-avatar__admin-controls">
      <div className="enhanced-avatar__admin-title">
        🎭 Avatar Decoration Testing
      </div>
      <div className="enhanced-avatar__decoration-grid">
        {decorationOptions.map((option) => (
          <button
            key={option.value}
            className={`enhanced-avatar__decoration-option ${
              selectedDecoration === option.value
                ? 'enhanced-avatar__decoration-option--active'
                : ''
            }`}
            onClick={() => setSelectedDecoration(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`enhanced-avatar enhanced-avatar--${size} ${className}`}>
      {/* Avatar with Decoration */}
      <div className="enhanced-avatar__content">{decoratedAvatar}</div>

      {/* Admin Controls with InteractiveTooltip */}
      {isOwnProfile && hasAdminAccess && (
        <div className="enhanced-avatar__admin-panel">
          <InteractiveTooltip
            content={adminControlsContent}
            triggerOnClick={true}
            className="enhanced-avatar__admin-tooltip"
          >
            <button
              className="enhanced-avatar__admin-toggle"
              title="Toggle Avatar Decoration Testing"
            >
              🎨
            </button>
          </InteractiveTooltip>
        </div>
      )}
    </div>
  );
}
