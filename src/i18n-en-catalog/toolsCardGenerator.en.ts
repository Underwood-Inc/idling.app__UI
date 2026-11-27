export interface ToolsCardGeneratorEnWelcomeCopy {
  title: string;
  intro: string;
  createNew: string;
  createNewDescription: string;
  loadPrevious: string;
  loadPreviousDescription: string;
  initializing: string;
  generationIdLabel: string;
  loadPlaceholder: string;
  load: string;
  generationIdHint: string;
  quotaReached: string;
  upgradeCta: string;
}

export interface ToolsCardGeneratorEnWizardProStepCopy {
  subscriptionNote: string;
  upgradeTitle: string;
  upgradeBody: string;
  proFeatureSuffix: string;
  widthHint: string;
  heightHint: string;
  shapeCountHint: string;
  shapeCountPlaceholder: string;
}

export interface ToolsCardGeneratorEnWizardConfirmCopy {
  body: string;
  sections: {
    platform: string;
    content: string;
    seeds: string;
    proSettings: string;
  };
  labels: {
    format: string;
    dimensions: string;
    author: string;
    quote: string;
    main: string;
    avatar: string;
    width: string;
    height: string;
    shapes: string;
  };
  randomValue: string;
}

export interface ToolsCardGeneratorEnWizardCopy {
  wizardTitle: string;
  basicEmptyNote: string;
  goToStepPrefix: string;
  steps: {
    platformSelection: string;
    basicConfiguration: string;
    proConfiguration: string;
    confirmAndGenerate: string;
  };
  stepDescriptions: {
    platform: string;
    basic: string;
    pro: string;
    confirm: string;
  };
  proStep: ToolsCardGeneratorEnWizardProStepCopy;
  confirmStep: ToolsCardGeneratorEnWizardConfirmCopy;
  choosePlatformTitle: string;
  choosePlatformBody: string;
  loadingAspectRatios: string;
  labels: {
    mainSeed: string;
    avatarSeed: string;
    author: string;
    quote: string;
    customWidth: string;
    customHeight: string;
    shapeCount: string;
  };
  placeholders: {
    random: string;
    randomQuote: string;
    auto: string;
  };
  hints: {
    pattern: string;
    avatar: string;
    author: string;
    quote: string;
  };
  reviewTitle: string;
  cancel: string;
  previous: string;
  next: string;
  generateCard: string;
  generating: string;
  dailyQuotaExceeded: string;
  upgradeForUnlimited: string;
}

export interface ToolsCardGeneratorEnGenerationFormSeedActionsCopy {
  save: string;
  cancelEdit: string;
  editMain: string;
  editAvatar: string;
}

export interface ToolsCardGeneratorEnGenerationFormCopy {
  configuration: string;
  viewingLoadedGeneration: string;
  readOnlyBanner: string;
  freeConfiguration: string;
  proConfigurationOptions: string;
  proBadge: string;
  hideDetails: string;
  showDetails: string;
  loadingAspectRatios: string;
  seedActions: ToolsCardGeneratorEnGenerationFormSeedActionsCopy;
  labels: {
    mainSeed: string;
    avatarSeed: string;
    author: string;
    quote: string;
    aspectRatio: string;
    width: string;
    height: string;
    shapeCount: string;
  };
  placeholders: {
    customSeed: string;
    autoSeed: string;
    avatarSeedUsesMain: string;
    avatarSeed: string;
    quoteAuthor: string;
    customQuote: string;
    auto: string;
    shapeCountDefault: string;
  };
  randomizeAll: string;
  generateImage: string;
  generating: string;
  readOnlyGeneration: string;
}

export interface ToolsCardGeneratorEnAdvancedControlsCopy {
  paywallTitle: string;
  paywallBody: string;
  upgradeLink: string;
  overlayTitle: string;
  overlayBody: string;
  upgradeButton: string;
  sections: {
    avatarPositioning: string;
    textLayout: string;
    visualEffects: string;
    patternMagic: string;
    watermarkControls: string;
  };
  labels: Record<string, string>;
  placeholders: Record<string, string>;
  watermarkPositions: Record<string, string>;
}

export interface ToolsCardGeneratorEnCopy {
  welcome: ToolsCardGeneratorEnWelcomeCopy;
  wizard: ToolsCardGeneratorEnWizardCopy;
  generationForm: ToolsCardGeneratorEnGenerationFormCopy;
  advancedControls: ToolsCardGeneratorEnAdvancedControlsCopy;
}

export const TOOLS_CARD_GENERATOR_EN = {
  welcome: {
    title: 'Enter the Realm of Mystical Creation',
    intro:
      'Ancient energies await your command. Choose your sacred path to weave enchanted social media cards blessed with mystical geometry and profound wisdom.',
    createNew: 'Create New',
    createNewDescription: 'Generate a fresh mystical card',
    loadPrevious: 'Load Previous',
    loadPreviousDescription: 'Retrieve an existing generation',
    initializing: 'Initializing mystical energies...',
    generationIdLabel: 'Generation ID:',
    loadPlaceholder: 'Paste your generation ID here...',
    load: 'Load',
    generationIdHint: 'Generation IDs look like:',
    quotaReached: 'Daily quota reached!',
    upgradeCta: 'Upgrade to Pro for unlimited generations',
  },
  wizard: {
    wizardTitle: 'Card Generator Wizard',
    basicEmptyNote: 'Leave fields empty for random generation.',
    goToStepPrefix: 'Go to',
    steps: {
      platformSelection: 'Platform Selection',
      basicConfiguration: 'Basic Configuration',
      proConfiguration: 'Pro Configuration',
      confirmAndGenerate: 'Confirm & Generate',
    },
    stepDescriptions: {
      platform: 'Select the platform and aspect ratio for your card',
      basic: 'Configure the main elements of your card',
      pro: 'Fine-tune advanced settings with your Pro subscription.',
      confirm: 'Review your configuration and generate your mystical card.',
    },
    proStep: {
      subscriptionNote:
        'This step contains advanced features available only to Pro subscribers. Wizard mode with basic configuration is completely free!',
      upgradeTitle: 'Upgrade to Pro',
      upgradeBody:
        'This step contains advanced features available only to Pro subscribers. Wizard mode with basic configuration is completely free!',
      proFeatureSuffix: '(Pro feature)',
      widthHint: 'Custom width in pixels',
      heightHint: 'Custom height in pixels',
      shapeCountHint: 'Number of background shapes',
      shapeCountPlaceholder: '8',
    },
    confirmStep: {
      body: 'Review your configuration and generate your mystical card.',
      sections: {
        platform: 'Platform',
        content: 'Content',
        seeds: 'Seeds',
        proSettings: 'Pro Settings',
      },
      labels: {
        format: 'Format:',
        dimensions: 'Dimensions:',
        author: 'Author:',
        quote: 'Quote:',
        main: 'Main:',
        avatar: 'Avatar:',
        width: 'Width:',
        height: 'Height:',
        shapes: 'Shapes:',
      },
      randomValue: 'Random',
    },
    choosePlatformTitle: 'Choose Your Platform',
    choosePlatformBody:
      "Select the platform where you'll be sharing your card. Each platform has optimized dimensions for the best visual impact.",
    loadingAspectRatios: 'Loading aspect ratios...',
    labels: {
      mainSeed: 'Main Seed',
      avatarSeed: 'Avatar Seed',
      author: 'Author',
      quote: 'Quote',
      customWidth: 'Custom Width',
      customHeight: 'Custom Height',
      shapeCount: 'Shape Count',
    },
    placeholders: {
      random: 'Leave empty for random',
      randomQuote: 'Leave empty for random inspirational quote',
      auto: 'Auto',
    },
    hints: {
      pattern: 'Controls the overall design pattern',
      avatar: 'Controls the avatar design',
      author: 'The person who said the quote',
      quote: 'The inspirational message for your card',
    },
    reviewTitle: 'Review & Generate',
    cancel: 'Cancel',
    previous: '← Previous',
    next: 'Next →',
    generateCard: 'Generate Card',
    generating: 'Generating...',
    dailyQuotaExceeded: 'Daily Quota Exceeded',
    upgradeForUnlimited: 'Upgrade to Pro for unlimited generations and advanced features!',
  },
  generationForm: {
    configuration: 'Configuration',
    viewingLoadedGeneration: 'Viewing Loaded Generation',
    readOnlyBanner:
      'This configuration is read-only. Create a new generation to make changes.',
    freeConfiguration: 'Free Configuration',
    proConfigurationOptions: 'Pro Configuration Options',
    proBadge: 'PRO',
    hideDetails: 'Hide Details',
    showDetails: 'Show Details',
    loadingAspectRatios: 'Loading aspect ratios...',
    seedActions: {
      save: 'Save seed',
      cancelEdit: 'Cancel edit',
      editMain: 'Edit seed',
      editAvatar: 'Edit avatar seed',
    },
    labels: {
      mainSeed: 'Main Seed',
      avatarSeed: 'Avatar Seed',
      author: 'Author',
      quote: 'Quote',
      aspectRatio: 'Aspect Ratio',
      width: 'Width',
      height: 'Height',
      shapeCount: 'Shape Count',
    },
    placeholders: {
      customSeed: 'Enter custom seed...',
      autoSeed: 'Auto-generated seed',
      avatarSeedUsesMain: 'Leave empty to use main seed',
      avatarSeed: 'Custom avatar seed (leave empty for random)',
      quoteAuthor: 'Quote author (leave empty for random)',
      customQuote: 'Enter custom quote (leave empty for random quote)',
      auto: 'Auto',
      shapeCountDefault: '8',
    },
    randomizeAll: 'Randomize All',
    generateImage: 'Generate Image',
    generating: 'Generating...',
    readOnlyGeneration: 'Read-Only Generation',
  },
  advancedControls: {
    paywallTitle: 'Unlock Advanced Magic',
    paywallBody:
      'Get precise control over avatar positioning, text layout, visual styling, and more with Pro subscription.',
    upgradeLink: 'Upgrade to Pro',
    overlayTitle: 'Unlock Advanced Magic',
    overlayBody: 'Gain precise control over every aspect of your mystical cards!',
    upgradeButton: 'Ascend to Archmage',
    sections: {
      avatarPositioning: 'Avatar Positioning',
      textLayout: 'Text Layout',
      visualEffects: 'Visual Effects',
      patternMagic: 'Pattern Magic',
      watermarkControls: 'Watermark Controls',
    },
    labels: {
      avatarX: 'Avatar X',
      avatarY: 'Avatar Y',
      avatarSize: 'Avatar Size',
      textMaxWidth: 'Text Max Width',
      textStartY: 'Text Start Y',
      textPadding: 'Text Padding',
      lineHeight: 'Line Height',
      borderOpacity: 'Border Opacity',
      borderColor: 'Border Color',
      patternSeed: 'Pattern Seed',
      glassBackground: 'Glass Background Effect',
      enableWatermark: 'Enable Custom Watermark',
      watermarkText: 'Watermark Text',
      position: 'Position',
      rotationDegrees: 'Rotation (degrees)',
      size: 'Size',
      opacityPercent: 'Opacity (%)',
    },
    placeholders: {
      auto: 'Auto',
      textPadding: '30',
      lineHeight: '1.4',
      borderOpacity: '0.7',
      patternSeed: 'Auto-generated',
      watermarkText: 'https://idling.app/card-generator',
      rotation: '-25',
      watermarkSize: '16',
      watermarkOpacity: '15',
    },
    watermarkPositions: {
      'top-left': 'Top Left',
      'top-right': 'Top Right',
      'bottom-left': 'Bottom Left',
      'bottom-right': 'Bottom Right',
      center: 'Center',
      repeated: 'Repeated Pattern',
    },
  },
} satisfies ToolsCardGeneratorEnCopy;