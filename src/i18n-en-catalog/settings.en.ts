export interface SettingsCategoryCopy {
  title: string;
  description: string;
}

export interface SettingsOptionCopy {
  label: string;
  description: string;
}

export interface SettingsEnCopy {
  page: {
    title: string;
    description: string;
    loading: string;
  };
  categories: {
    appearance: SettingsCategoryCopy;
    behavior: SettingsCategoryCopy;
    accessibility: SettingsCategoryCopy;
    background: SettingsCategoryCopy;
    privacy: SettingsCategoryCopy;
  };
  account: {
    signedInAsPrefix: string;
    syncNote: string;
    notSignedIn: string;
    localOnlyNote: string;
  };
  appearance: {
    fontFamily: {
      cardTitle: string;
      code: SettingsOptionCopy;
      reading: SettingsOptionCopy;
    };
    displayDensity: {
      cardTitle: string;
      cozy: SettingsOptionCopy;
      compact: SettingsOptionCopy;
    };
  };
  behavior: {
    pageNavigation: {
      cardTitle: string;
      traditional: SettingsOptionCopy;
      infiniteScroll: SettingsOptionCopy;
    };
    emojiPanel: {
      cardTitle: string;
      closeAfterSelect: SettingsOptionCopy;
      stayOpen: SettingsOptionCopy;
    };
  };
  accessibility: {
    focusIndicators: {
      cardTitle: string;
      disabled: SettingsOptionCopy;
      enabled: SettingsOptionCopy;
    };
  };
  background: {
    movementDirection: {
      cardTitle: string;
      static: SettingsOptionCopy;
      forward: SettingsOptionCopy;
      backward: SettingsOptionCopy;
      left: SettingsOptionCopy;
      right: SettingsOptionCopy;
      up: SettingsOptionCopy;
      down: SettingsOptionCopy;
    };
    movementSpeed: {
      cardTitle: string;
      slow: SettingsOptionCopy;
      normal: SettingsOptionCopy;
      fast: SettingsOptionCopy;
    };
    audioReactivity: {
      cardTitle: string;
      hint: string;
      rangeLabel: string;
      tickOff: string;
      tickFull: string;
    };
    animationLayers: {
      cardTitle: string;
      enabledCountSuffix: string;
      stars: string;
      particles: string;
      nebula: string;
      planets: string;
      aurora: string;
    };
  };
  privacy: {
    profileVisibility: {
      cardTitle: string;
      public: SettingsOptionCopy;
      private: SettingsOptionCopy;
    };
  };
  common: {
    on: string;
    off: string;
    enabled: string;
    disabled: string;
  };
}

export const SETTINGS_EN = {
  page: {
    title: 'Settings',
    description: 'Customize your experience and preferences',
    loading: 'Loading settings...',
  },
  categories: {
    appearance: {
      title: 'Appearance',
      description: 'Customize how the site looks and feels',
    },
    behavior: {
      title: 'Behavior',
      description: 'Control how the site behaves and responds',
    },
    accessibility: {
      title: 'Accessibility',
      description: 'Make the site easier to use for everyone',
    },
    background: {
      title: 'Background Effects',
      description: 'Customize the animated space background',
    },
    privacy: {
      title: 'Privacy & Profile',
      description: 'Control your profile visibility and data',
    },
  },
  account: {
    signedInAsPrefix: 'Signed in as',
    syncNote: 'Settings sync across devices',
    notSignedIn: 'Not signed in',
    localOnlyNote: 'Settings saved locally only',
  },
  appearance: {
    fontFamily: {
      cardTitle: 'Font Family',
      code: {
        label: 'Code',
        description: 'Fira Code - Perfect for coding',
      },
      reading: {
        label: 'Reading',
        description: 'System fonts - Easy on the eyes',
      },
    },
    displayDensity: {
      cardTitle: 'Display Density',
      cozy: {
        label: 'Cozy',
        description: 'More spacing, easier to read',
      },
      compact: {
        label: 'Compact',
        description: 'Less spacing, more content',
      },
    },
  },
  behavior: {
    pageNavigation: {
      cardTitle: 'Page Navigation',
      traditional: {
        label: 'Traditional',
        description: 'Page numbers with next/previous',
      },
      infiniteScroll: {
        label: 'Infinite Scroll',
        description: 'Auto-load content as you scroll',
      },
    },
    emojiPanel: {
      cardTitle: 'Emoji Panel',
      closeAfterSelect: {
        label: 'Close After Select',
        description: 'Panel closes after picking one emoji',
      },
      stayOpen: {
        label: 'Stay Open',
        description: 'Pick multiple emojis before closing',
      },
    },
  },
  accessibility: {
    focusIndicators: {
      cardTitle: 'Focus Indicators',
      disabled: {
        label: 'Disabled',
        description: 'Clean visual design without focus outlines',
      },
      enabled: {
        label: 'Enabled',
        description: 'Show focus outlines for keyboard navigation',
      },
    },
  },
  background: {
    movementDirection: {
      cardTitle: 'Movement Direction',
      static: { label: 'Static', description: 'No movement' },
      forward: { label: 'Forward', description: 'Flying ahead' },
      backward: { label: 'Backward', description: 'Pulling back' },
      left: { label: 'Left', description: 'Drift left' },
      right: { label: 'Right', description: 'Drift right' },
      up: { label: 'Up', description: 'Drift up' },
      down: { label: 'Down', description: 'Drift down' },
    },
    movementSpeed: {
      cardTitle: 'Movement Speed',
      slow: { label: 'Slow', description: 'Relaxed pace' },
      normal: { label: 'Normal', description: 'Standard speed' },
      fast: { label: 'Fast', description: 'High speed' },
    },
    audioReactivity: {
      cardTitle: 'Background Audio Reactivity',
      hint: 'How strongly the galaxy background responds to radio playback. 0% keeps the static background; 100% is full reactivity.',
      rangeLabel: 'Reactivity intensity',
      tickOff: 'Off',
      tickFull: 'Full',
    },
    animationLayers: {
      cardTitle: 'Animation Layers',
      enabledCountSuffix: 'of 5 enabled',
      stars: 'Stars',
      particles: 'Particles',
      nebula: 'Nebula',
      planets: 'Planets',
      aurora: 'Aurora',
    },
  },
  privacy: {
    profileVisibility: {
      cardTitle: 'Profile Visibility',
      public: {
        label: 'Public',
        description: 'Profile visible to everyone',
      },
      private: {
        label: 'Private',
        description: 'Profile hidden from others',
      },
    },
  },
  common: {
    on: 'On',
    off: 'Off',
    enabled: 'Enabled',
    disabled: 'Disabled',
  },
} satisfies SettingsEnCopy;