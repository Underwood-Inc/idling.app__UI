#!/usr/bin/env node
/* eslint-disable max-len */

/* eslint-disable no-console, no-undef */

/**
 * ===============================================================================
 * 🚀 ENHANCED FAKER + CHALK SEED SCRIPT FOR REALISTIC SOCIAL MEDIA DATA
 * ===============================================================================
 *
 * 📖 WHAT THIS SCRIPT DOES (FOR NON-TECHNICAL PEOPLE):
 * This script creates fake but incredibly realistic social media content - like
 * creating a fake Twitter or Reddit with thousands of users having real
 * conversations about technology topics. It's like having a movie set with
 * thousands of actors, but for a social media app.
 *
 * 🎯 WHY WE NEED THIS:
 * - TESTING: We need lots of realistic data to test if our app works properly
 * - DEVELOPMENT: Developers need realistic content to build and test features
 * - PERFORMANCE: We test how fast the app runs with thousands of users
 * - DESIGN: Designers see how the app looks with real-looking content
 *
 * ✨ WHAT MAKES THIS SCRIPT SPECIAL:
 * - Creates 7 different personality types (students, seniors, freelancers, etc.)
 * - Generates conversations that sound like real people talking
 * - Creates multi-level discussions (replies to replies to replies, up to 5 levels)
 * - Uses 100+ different templates and variations for each type of content
 * - Includes industry-specific language and hashtags
 * - Makes realistic timing patterns (when posts are created)
 * - Supports multiple geographic regions and experience levels
 * - Can create millions of posts efficiently
 *
 * 🚀 HOW TO USE THIS SCRIPT (STEP BY STEP):
 * 1. Open your terminal/command prompt
 * 2. Navigate to your project folder
 * 3. Type: npm run dev:seed (or yarn dev:seed)
 * 4. Answer the questions about what kind of data you want:
 *    - How many users? (like asking "how many people should be in our fake community?")
 *    - How many posts? (like asking "how many conversations should they have?")
 *    - How realistic? (basic = simple, ultra = very detailed and realistic)
 *    - What industry focus? (web development, mobile apps, data science, etc.)
 *    - Where are users from? (USA, Europe, Asia, or global mix)
 * 5. Wait for the script to run (it shows colorful progress updates)
 * 6. Your database will be filled with realistic test data
 *
 * 🛠️ TECHNICAL REQUIREMENTS:
 * - Node.js (JavaScript runtime environment)
 * - PostgreSQL database (where the data is stored)
 * - Faker.js library (creates fake but realistic data)
 * - Chalk library (makes colorful terminal output)
 * - Environment variables set up for database connection
 *
 * 📊 CONFIGURATION OPTIONS EXPLAINED:
 * - USERS: How many fake people to create (default: 10,000)
 * - POSTS: How many main posts to create (default: 50,000)
 * - REPLY FREQUENCY: How often people reply (0.0 = never, 1.0 = always reply)
 * - CONTENT REALISM:
 *   * Basic = Simple, short posts
 *   * Standard = Medium complexity
 *   * Ultra = Very detailed, realistic posts with technical depth
 * - INDUSTRY FOCUS:
 *   * Web = Focus on websites, HTML, CSS, JavaScript
 *   * Mobile = Focus on apps, iOS, Android
 *   * Data = Focus on databases, analytics, AI
 *   * DevOps = Focus on servers, deployment, infrastructure
 *   * Mixed = Combination of all industries
 * - GEOGRAPHIC DISTRIBUTION:
 *   * USA = American names, locations, time zones
 *   * Europe = European names, locations, time zones
 *   * Asia = Asian names, locations, time zones
 *   * Global = Mix of all regions
 * - EXPERIENCE DISTRIBUTION:
 *   * Junior-heavy = More beginners and students
 *   * Senior-heavy = More experienced developers
 *   * Realistic = Natural mix like real communities
 *
 * 🎭 USER PERSONAS CREATED:
 * 1. SENIOR ENGINEER: Experienced, gives detailed technical advice
 * 2. JUNIOR DEVELOPER: New to programming, asks lots of questions
 * 3. TECH LEAD: Manages teams, focuses on architecture and best practices
 * 4. FREELANCER: Works independently, shares project experiences
 * 5. STUDENT: Learning programming, shares learning journey
 * 6. DESIGNER-DEVELOPER: Focuses on UI/UX and front-end development
 * 7. DATA SCIENTIST: Specializes in data analysis and machine learning
 *
 * 💬 CONVERSATION TYPES GENERATED:
 * - Technical discussions about programming
 * - Career advice and job hunting
 * - Learning resources and tutorials
 * - Project showcases and portfolios
 * - Questions and help requests
 * - Industry news and trends
 * - Tool and framework comparisons
 *
 * 🔄 THREADING SYSTEM:
 * The script creates realistic conversation threads up to 5 levels deep:
 * - Level 1: Direct replies to main posts
 * - Level 2: Replies to replies (continuing conversation)
 * - Level 3: Deeper discussion threads
 * - Level 4: Detailed technical exchanges
 * - Level 5: Final thoughts and conclusions
 *
 * 📈 PERFORMANCE FEATURES:
 * - Batch processing for efficient database operations
 * - Memory-optimized for large datasets
 * - Progress reporting with colorful output
 * - Configurable batch sizes
 * - Support for millions of records
 *
 * 🎨 VISUAL FEATURES:
 * - Colorful terminal output using Chalk
 * - Progress bars and status updates
 * - Clear error messages and warnings
 * - Formatted statistics and summaries
 *
 * 🔧 CUSTOMIZATION:
 * You can modify this script to:
 * - Add new user personas
 * - Create new content templates
 * - Add new industries or technologies
 * - Modify conversation patterns
 * - Adjust timing and engagement patterns
 *
 * ⚠️ IMPORTANT NOTES:
 * - This script CLEARS existing data before creating new data
 * - Make sure you have a backup if you have important data
 * - The script can take several minutes to hours for large datasets
 * - Database performance depends on your system specifications
 *
 * 🆘 TROUBLESHOOTING:
 * - "Missing dependencies" error: Run `npm install @faker-js/faker chalk`
 * - Database connection error: Check your .env.local file
 * - Out of memory: Reduce batch size or number of records
 * - Slow performance: Check database indexes and system resources
 *
 * ===============================================================================
 */

require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');
const readline = require('readline');
const crypto = require('crypto');
const {
  Worker,
  isMainThread,
  parentPort,
  workerData
} = require('worker_threads');

// Import faker and chalk
let faker, chalk;
try {
  faker = require('@faker-js/faker').faker;
  chalk = require('chalk');
} catch (error) {
  console.error('❌ Missing dependencies. Please install:');
  console.error('npm install @faker-js/faker chalk');
  process.exit(1);
}

// ================================
// PROGRESS ANIMATION SYSTEM
// ================================

class ProgressAnimator {
  constructor() {
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.currentFrame = 0;
    this.interval = null;
    this.isRunning = false;
    this.lastMessage = '';
  }

  start(message) {
    this.lastMessage = message;
    this.isRunning = true;
    this.currentFrame = 0;

    // Hide cursor
    process.stdout.write('\x1B[?25l');

    this.interval = setInterval(() => {
      this.update(this.lastMessage);
    }, 80);
  }

  update(message) {
    if (!this.isRunning) return;

    this.lastMessage = message;
    const frame = this.frames[this.currentFrame];
    this.currentFrame = (this.currentFrame + 1) % this.frames.length;

    // Clear line and write new content
    process.stdout.write('\r\x1B[K');
    process.stdout.write(chalk.cyan(`${frame} ${message}`));
  }

  success(message) {
    this.stop();
    process.stdout.write('\r\x1B[K');
    console.log(chalk.green(`✅ ${message}`));
  }

  error(message) {
    this.stop();
    process.stdout.write('\r\x1B[K');
    console.log(chalk.red(`❌ ${message}`));
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;

    // Show cursor
    process.stdout.write('\x1B[?25h');
  }
}

// ================================
// ASYNC BATCH PROCESSOR
// ================================

class AsyncBatchProcessor {
  constructor(batchSize = 100, concurrency = 4) {
    this.batchSize = batchSize;
    this.concurrency = concurrency;
  }

  async processBatches(items, processorFn, progressCallback) {
    const batches = this.createBatches(items);
    const results = [];

    for (let i = 0; i < batches.length; i += this.concurrency) {
      const batchPromises = [];

      for (let j = 0; j < this.concurrency && i + j < batches.length; j++) {
        const batchIndex = i + j;
        const batch = batches[batchIndex];

        const promise = processorFn(batch, batchIndex).then((result) => {
          if (progressCallback) {
            progressCallback(batchIndex + 1, batches.length);
          }
          return result;
        });

        batchPromises.push(promise);
      }

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results.flat();
  }

  createBatches(items) {
    const batches = [];
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize));
    }
    return batches;
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const sql = postgres({
  host:
    process.env.POSTGRES_HOST ||
    (process.env.IS_DOCKERIZED ? 'postgres' : 'localhost'),
  user: process.env.POSTGRES_USER || 'postgres',
  database: process.env.POSTGRES_DB || 'idling',
  password:
    process.env.POSTGRES_PASSWORD ||
    process.env.DOCKER_POSTGRES_PASSWORD ||
    'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  ssl: 'prefer',
  max: 20,
  idle_timeout: 0,
  connect_timeout: 60
});

// ================================
// ENHANCED CONFIGURATION SYSTEM
// ================================

class EnhancedSeedConfig {
  constructor() {
    this.users = 10000;
    this.posts = 50000;
    this.maxRepliesPerPost = 12;
    this.replyFrequency = 0.75;
    this.contentRealism = 'ultra';
    this.industryFocus = 'mixed';
    this.geographicDistribution = 'global';
    this.temporalDistribution = 'natural';
    this.languageVariety = 'english';
    this.experienceDistribution = 'realistic';
    this.contentTypes = [
      'technical',
      'career',
      'learning',
      'showcase',
      'question'
    ];
    this.hashtagComplexity = 'varied';
    this.batchSize = 1000;
  }

  async promptForConfig() {
    console.clear();
    console.log(chalk.bold.cyan('\n🚀 FAKER + CHALK ENHANCED SEED SCRIPT'));
    console.log(chalk.cyan('==========================================\n'));

    console.log(chalk.yellow('📊 BASIC CONFIGURATION'));
    console.log(chalk.gray('------------------------'));

    const usersInput = await askQuestion(
      chalk.blue(
        `Number of users (default: ${chalk.bold(this.users.toLocaleString())}): `
      )
    );
    this.users = parseInt(usersInput) || this.users;

    const postsInput = await askQuestion(
      chalk.blue(
        `Number of main posts (default: ${chalk.bold(this.posts.toLocaleString())}): `
      )
    );
    this.posts = parseInt(postsInput) || this.posts;

    const replyFreqInput = await askQuestion(
      chalk.blue(
        `Reply frequency 0.0-1.0 (default: ${chalk.bold(this.replyFrequency)}): `
      )
    );
    this.replyFrequency = parseFloat(replyFreqInput) || this.replyFrequency;

    console.log(chalk.yellow('\n🎨 CONTENT REALISM'));
    console.log(chalk.gray('-------------------'));

    const realismOptions = `${chalk.green('basic')}, ${chalk.yellow('standard')}, ${chalk.red('ultra')}`;
    const realismInput = await askQuestion(
      chalk.blue(
        `Content realism (${realismOptions}, default: ${chalk.bold(this.contentRealism)}): `
      )
    );
    this.contentRealism = realismInput.toLowerCase() || this.contentRealism;

    const industryOptions = `${chalk.green('web')}, ${chalk.yellow('mobile')}, ${chalk.red('data')}, ${chalk.cyan('devops')}, ${chalk.magenta('mixed')}`;
    const industryInput = await askQuestion(
      chalk.blue(
        `Industry focus (${industryOptions}, default: ${chalk.bold(this.industryFocus)}): `
      )
    );
    this.industryFocus = industryInput.toLowerCase() || this.industryFocus;

    console.log(chalk.yellow('\n🌍 DIVERSITY SETTINGS'));
    console.log(chalk.gray('---------------------'));

    const geoOptions = `${chalk.green('usa')}, ${chalk.yellow('europe')}, ${chalk.red('asia')}, ${chalk.cyan('global')}`;
    const geoInput = await askQuestion(
      chalk.blue(
        `Geographic distribution (${geoOptions}, default: ${chalk.bold(this.geographicDistribution)}): `
      )
    );
    this.geographicDistribution =
      geoInput.toLowerCase() || this.geographicDistribution;

    const expOptions = `${chalk.green('junior-heavy')}, ${chalk.yellow('senior-heavy')}, ${chalk.red('realistic')}`;
    const experienceInput = await askQuestion(
      chalk.blue(
        `Experience distribution (${expOptions}, default: ${chalk.bold(this.experienceDistribution)}): `
      )
    );
    this.experienceDistribution =
      experienceInput.toLowerCase() || this.experienceDistribution;

    console.log(chalk.yellow('\n⏰ TEMPORAL SETTINGS'));
    console.log(chalk.gray('--------------------'));

    const tempOptions = `${chalk.green('recent')}, ${chalk.yellow('spread')}, ${chalk.red('natural')}`;
    const temporalInput = await askQuestion(
      chalk.blue(
        `Temporal distribution (${tempOptions}, default: ${chalk.bold(this.temporalDistribution)}): `
      )
    );
    this.temporalDistribution =
      temporalInput.toLowerCase() || this.temporalDistribution;

    this.batchSize = Math.max(
      100,
      Math.min(2000, Math.floor(Math.sqrt(this.posts) * 10))
    );

    const estimatedReplies = Math.floor(
      this.posts * this.replyFrequency * (this.maxRepliesPerPost / 3)
    );

    console.log(chalk.yellow('\n📊 GENERATION SUMMARY'));
    console.log(chalk.gray('======================'));
    console.log(
      chalk.white(`  Users: ${chalk.bold.green(this.users.toLocaleString())}`)
    );
    console.log(
      chalk.white(`  Posts: ${chalk.bold.green(this.posts.toLocaleString())}`)
    );
    console.log(
      chalk.white(
        `  Est. Replies: ${chalk.bold.yellow(estimatedReplies.toLocaleString())}`
      )
    );
    console.log(
      chalk.white(
        `  Total Records: ${chalk.bold.red((this.posts + estimatedReplies).toLocaleString())}`
      )
    );
    console.log(
      chalk.white(`  Realism Level: ${chalk.bold.cyan(this.contentRealism)}`)
    );
    console.log(
      chalk.white(`  Industry Focus: ${chalk.bold.magenta(this.industryFocus)}`)
    );
    console.log(
      chalk.white(
        `  Geographic: ${chalk.bold.blue(this.geographicDistribution)}`
      )
    );
    console.log(
      chalk.white(`  Batch Size: ${chalk.bold.gray(this.batchSize)}`)
    );

    const confirm = await askQuestion(
      chalk.bold.red('\n🚀 Proceed with generation? (y/N): ')
    );
    if (confirm.toLowerCase() !== 'y') {
      console.log(chalk.red('❌ Generation cancelled.'));
      process.exit(0);
    }
  }
}

// ================================
// FAKER-POWERED CONTENT GENERATOR
// ================================

class FakerContentGenerator {
  constructor(config) {
    this.config = config;
    this.initializeIndustryData();
    this.initializePersonas();
    this.initializeContentTemplates();
    this.initializeGeographicData();
  }

  initializeIndustryData() {
    this.industries = {
      web: {
        technologies: [
          // Frontend Frameworks & Libraries (30+ options)
          'React',
          'Vue.js',
          'Angular',
          'Svelte',
          'Next.js',
          'Nuxt.js',
          'Gatsby',
          'Remix',
          'SvelteKit',
          'Astro',
          'Solid.js',
          'Preact',
          'Alpine.js',
          'Lit',
          'Stencil',
          'Ember.js',
          'Backbone.js',
          'Knockout.js',
          'Polymer',
          'Mithril',
          'Riot.js',
          'Hyperapp',
          'Choo',
          'Cycle.js',
          'Inferno',
          'Marko',
          'Stimulus',
          'Turbo',
          'HTMX',
          'Web Components',

          // Backend Technologies (25+ options)
          'Node.js',
          'Express.js',
          'Fastify',
          'Koa',
          'Hapi',
          'Nest.js',
          'Adonis.js',
          'Meteor',
          'Strapi',
          'KeystoneJS',
          'Sails.js',
          'Total.js',
          'Restify',
          'Feathers.js',
          'LoopBack',
          'Moleculer',
          'ActionHero',
          'Derby.js',
          'Mean.js',
          'Socket.io',
          'GraphQL',
          'Apollo Server',
          'Hasura',
          'Prisma',
          'tRPC',

          // Languages & Core Technologies (20+ options)
          'JavaScript',
          'TypeScript',
          'HTML5',
          'CSS3',
          'SCSS',
          'Sass',
          'Less',
          'Stylus',
          'PostCSS',
          'WebAssembly',
          'Rust',
          'Go',
          'Python',
          'PHP',
          'Ruby',
          'Java',
          'C#',
          'Elixir',
          'Clojure',
          'Elm',

          // Build Tools & Bundlers (15+ options)
          'Webpack',
          'Vite',
          'Rollup',
          'Parcel',
          'esbuild',
          'Snowpack',
          'Turbopack',
          'Gulp',
          'Grunt',
          'Browserify',
          'Babel',
          'SWC',
          'Rome',
          'Biome',
          'tsup',

          // Testing & Quality (10+ options)
          'Jest',
          'Vitest',
          'Cypress',
          'Playwright',
          'Puppeteer',
          'Testing Library',
          'Enzyme',
          'Mocha',
          'Chai',
          'Sinon',
          'ESLint',
          'Prettier',
          'Husky'
        ],
        frameworks: [
          'Express.js',
          'Fastify',
          'Koa',
          'Nest.js',
          'Hapi',
          'Adonis.js',
          'Sails.js',
          'Meteor',
          'Strapi',
          'KeystoneJS',
          'Total.js',
          'Restify',
          'Feathers.js',
          'LoopBack',
          'Moleculer',
          'ActionHero',
          'Derby.js',
          'Mean.js',
          'Gatsby',
          'Next.js',
          'Nuxt.js',
          'Remix',
          'SvelteKit',
          'Astro',
          'Solid Start'
        ],
        topics: [
          'responsive design',
          'accessibility',
          'performance optimization',
          'SEO',
          'web vitals',
          'browser compatibility',
          'progressive web apps',
          'server-side rendering',
          'static site generation',
          'micro-frontends',
          'component architecture',
          'state management',
          'routing',
          'authentication',
          'authorization',
          'caching',
          'lazy loading',
          'code splitting',
          'bundle optimization',
          'web security',
          'CORS',
          'CSP',
          'XSS prevention',
          'CSRF protection',
          'API design',
          'REST APIs',
          'GraphQL',
          'WebSockets',
          'real-time communication',
          'database integration',
          'ORM',
          'query optimization',
          'deployment',
          'CI/CD',
          'monitoring',
          'error tracking',
          'analytics',
          'A/B testing',
          'internationalization',
          'localization',
          'web standards',
          'browser APIs',
          'service workers',
          'web workers',
          'IndexedDB',
          'local storage'
        ],
        hashtags: [
          'webdev',
          'frontend',
          'backend',
          'fullstack',
          'javascript',
          'typescript',
          'react',
          'vue',
          'angular',
          'svelte',
          'nextjs',
          'nuxtjs',
          'css',
          'html',
          'scss',
          'tailwind',
          'bootstrap',
          'responsive',
          'ux',
          'ui',
          'design',
          'nodejs',
          'express',
          'api',
          'rest',
          'graphql',
          'database',
          'mongodb',
          'postgresql',
          'mysql',
          'redis',
          'docker',
          'aws',
          'vercel',
          'netlify',
          'performance',
          'seo',
          'accessibility',
          'pwa',
          'ssr',
          'spa',
          'jamstack',
          'testing',
          'jest',
          'cypress',
          'webpack',
          'vite',
          'babel',
          'eslint'
        ]
      },
      mobile: {
        technologies: [
          // Cross-Platform Frameworks (15+ options)
          'React Native',
          'Flutter',
          'Xamarin',
          'Ionic',
          'Cordova',
          'PhoneGap',
          'NativeScript',
          'Appcelerator Titanium',
          'Unity',
          'Unreal Engine',
          'Corona SDK',
          'MonoGame',
          'Cocos2d-x',
          'GameMaker Studio',
          'Construct 3',

          // Native iOS Technologies (20+ options)
          'Swift',
          'Objective-C',
          'SwiftUI',
          'UIKit',
          'Core Data',
          'Core Animation',
          'Core Graphics',
          'AVFoundation',
          'MapKit',
          'CloudKit',
          'HealthKit',
          'HomeKit',
          'WatchKit',
          'ARKit',
          'RealityKit',
          'Metal',
          'Core ML',
          'Vision Framework',
          'Natural Language',
          'Speech Framework',

          // Native Android Technologies (20+ options)
          'Kotlin',
          'Java',
          'Jetpack Compose',
          'Android Views',
          'Room Database',
          'LiveData',
          'ViewModel',
          'WorkManager',
          'Navigation Component',
          'Data Binding',
          'View Binding',
          'Retrofit',
          'Volley',
          'OkHttp',
          'Glide',
          'Picasso',
          'Dagger',
          'Hilt',
          'RxJava',
          'Coroutines',

          // Backend & Services (15+ options)
          'Firebase',
          'AWS Amplify',
          'Supabase',
          'Parse',
          'Back4App',
          'Realm',
          'MongoDB Realm',
          'SQLite',
          'Realm Database',
          'Couchbase Lite',
          'GraphQL',
          'REST APIs',
          'Socket.io',
          'WebRTC',
          'Push Notifications',

          // Development Tools (15+ options)
          'Xcode',
          'Android Studio',
          'VS Code',
          'IntelliJ IDEA',
          'AppCode',
          'Fastlane',
          'Bitrise',
          'CircleCI',
          'GitHub Actions',
          'Firebase Test Lab',
          'TestFlight',
          'Google Play Console',
          'Crashlytics',
          'Sentry',
          'Bugsnag',

          // Testing & Quality (10+ options)
          'XCTest',
          'Espresso',
          'UI Automator',
          'Detox',
          'Appium',
          'Calabash',
          'EarlGrey',
          'KIF',
          'Quick',
          'Nimble',
          'JUnit',
          'Mockito'
        ],
        frameworks: [
          'Expo',
          'SwiftUI',
          'UIKit',
          'Jetpack Compose',
          'Android Views',
          'Firebase',
          'AWS Amplify',
          'Supabase',
          'Realm',
          'Core Data',
          'Room Database',
          'SQLite',
          'Retrofit',
          'Alamofire',
          'AFNetworking',
          'Volley',
          'OkHttp',
          'Moya',
          'RxSwift',
          'RxJava',
          'Combine',
          'PromiseKit',
          'Bolts',
          'ReactiveCocoa',
          'RxKotlin'
        ],
        topics: [
          'app store optimization',
          'mobile performance',
          'offline functionality',
          'push notifications',
          'biometric authentication',
          'in-app purchases',
          'mobile analytics',
          'crash reporting',
          'user onboarding',
          'mobile UX',
          'responsive design',
          'accessibility',
          'internationalization',
          'app security',
          'data encryption',
          'secure storage',
          'certificate pinning',
          'mobile testing',
          'automated testing',
          'beta testing',
          'app distribution',
          'continuous integration',
          'continuous deployment',
          'app monitoring',
          'performance monitoring',
          'memory management',
          'battery optimization',
          'network optimization',
          'caching strategies',
          'offline-first design',
          'progressive web apps',
          'mobile web',
          'hybrid development',
          'native development',
          'cross-platform development',
          'app architecture',
          'MVVM',
          'MVP',
          'MVI',
          'Clean Architecture',
          'dependency injection',
          'reactive programming',
          'state management',
          'navigation patterns',
          'deep linking',
          'universal links',
          'app shortcuts',
          'widgets',
          'notifications',
          'background processing',
          'location services',
          'camera integration',
          'media handling',
          'augmented reality',
          'machine learning',
          'core ML',
          'TensorFlow Lite',
          'ML Kit'
        ],
        hashtags: [
          'mobiledev',
          'ios',
          'android',
          'swift',
          'kotlin',
          'reactnative',
          'flutter',
          'xamarin',
          'ionic',
          'cordova',
          'swiftui',
          'jetpackcompose',
          'uikit',
          'firebase',
          'realm',
          'coredata',
          'sqlite',
          'retrofit',
          'alamofire',
          'expo',
          'nativescript',
          'unity',
          'gamedev',
          'ar',
          'vr',
          'ml',
          'ai',
          'appstore',
          'googleplay',
          'aso',
          'mobile',
          'app',
          'development',
          'testing',
          'automation',
          'ci',
          'cd',
          'performance',
          'security',
          'ux',
          'ui',
          'design',
          'accessibility',
          'offline',
          'pwa',
          'hybrid',
          'native',
          'crossplatform',
          'architecture',
          'mvvm',
          'mvp',
          'clean'
        ]
      },
      data: {
        technologies: [
          'Python',
          'R',
          'SQL',
          'Pandas',
          'NumPy',
          'TensorFlow',
          'PyTorch',
          'Spark',
          'Hadoop',
          'Kafka'
        ],
        frameworks: [
          'Scikit-learn',
          'Keras',
          'FastAPI',
          'Django',
          'Flask',
          'Airflow',
          'dbt',
          'Streamlit'
        ],
        topics: [
          'machine learning',
          'data visualization',
          'ETL pipelines',
          'data warehousing',
          'real-time analytics',
          'MLOps'
        ],
        hashtags: [
          'datascience',
          'machinelearning',
          'ai',
          'python',
          'analytics',
          'bigdata',
          'ml',
          'deeplearning',
          'dataviz',
          'mlops'
        ]
      },
      devops: {
        technologies: [
          'Docker',
          'Kubernetes',
          'AWS',
          'Azure',
          'GCP',
          'Terraform',
          'Ansible',
          'Jenkins',
          'GitLab CI',
          'GitHub Actions'
        ],
        frameworks: [
          'Helm',
          'Istio',
          'Prometheus',
          'Grafana',
          'ELK Stack',
          'Vault',
          'Consul'
        ],
        topics: [
          'CI/CD',
          'infrastructure as code',
          'monitoring',
          'logging',
          'security',
          'scalability',
          'disaster recovery'
        ],
        hashtags: [
          'devops',
          'kubernetes',
          'docker',
          'aws',
          'cloud',
          'cicd',
          'infrastructure',
          'monitoring',
          'automation',
          'sre'
        ]
      }
    };

    this.mixedIndustryWeights = {
      web: 0.35,
      mobile: 0.25,
      data: 0.25,
      devops: 0.15
    };
  }

  initializePersonas() {
    this.personas = [
      {
        type: 'senior_engineer',
        weight: 0.12,
        postFreq: 0.25,
        replyFreq: 0.8,
        complexity: 'high',
        contentTypes: ['technical', 'career', 'showcase'],
        toneKeywords: [
          'architecture',
          'scalable',
          'production',
          'enterprise',
          'optimization'
        ]
      },
      {
        type: 'junior_developer',
        weight: 0.28,
        postFreq: 0.85,
        replyFreq: 0.95,
        complexity: 'medium',
        contentTypes: ['learning', 'question', 'showcase'],
        toneKeywords: ['learning', 'tutorial', 'beginner', 'help', 'first time']
      },
      {
        type: 'tech_lead',
        weight: 0.08,
        postFreq: 0.35,
        replyFreq: 0.75,
        complexity: 'high',
        contentTypes: ['technical', 'career', 'learning'],
        toneKeywords: [
          'team',
          'leadership',
          'strategy',
          'mentoring',
          'best practices'
        ]
      },
      {
        type: 'freelancer',
        weight: 0.15,
        postFreq: 0.65,
        replyFreq: 0.6,
        complexity: 'medium',
        contentTypes: ['showcase', 'career', 'technical'],
        toneKeywords: ['client', 'project', 'freelance', 'remote', 'business']
      },
      {
        type: 'student',
        weight: 0.2,
        postFreq: 0.9,
        replyFreq: 0.85,
        complexity: 'low',
        contentTypes: ['learning', 'question', 'showcase'],
        toneKeywords: [
          'bootcamp',
          'course',
          'university',
          'internship',
          'studying'
        ]
      },
      {
        type: 'designer_dev',
        weight: 0.1,
        postFreq: 0.55,
        replyFreq: 0.7,
        complexity: 'medium',
        contentTypes: ['showcase', 'technical', 'learning'],
        toneKeywords: ['design', 'ux', 'ui', 'creative', 'visual', 'prototype']
      },
      {
        type: 'data_scientist',
        weight: 0.07,
        postFreq: 0.45,
        replyFreq: 0.65,
        complexity: 'high',
        contentTypes: ['technical', 'showcase', 'learning'],
        toneKeywords: [
          'analysis',
          'model',
          'dataset',
          'insights',
          'research',
          'statistics'
        ]
      }
    ];
  }

  initializeContentTemplates() {
    // 100+ templates for each content type for maximum variety
    this.contentTemplates = {
      technical: [
        // Deep Technical Analysis (25+ templates)
        'Deep dive into {technology} {topic} - what you need to know',
        'Building scalable {topic} with {technology}: lessons learned',
        'Performance optimization techniques for {technology} in production',
        'Advanced {technology} patterns and practices every developer should know',
        'Migrating from {oldTech} to {technology}: a complete guide',
        'Security considerations when using {technology} in enterprise',
        'Understanding {technology} internals: how it really works',
        'Debugging {technology} applications: tools and techniques',
        'Testing strategies for {technology} applications',
        'Monitoring and observability with {technology}',
        'Memory management in {technology}: avoiding common pitfalls',
        'Concurrency patterns in {technology}: best practices',
        'Error handling strategies for {technology} applications',
        'Code organization and architecture with {technology}',
        'Performance profiling {technology} applications',
        'Scaling {technology} applications: horizontal vs vertical',
        'Database integration patterns with {technology}',
        'API design principles using {technology}',
        'Caching strategies for {technology} applications',
        'Load balancing {technology} services',
        'Container orchestration with {technology}',
        'Microservices architecture using {technology}',
        'Event-driven architecture with {technology}',
        'Real-time communication in {technology}',
        'State management patterns in {technology}',

        // Comparison & Analysis (20+ templates)
        '{technology} vs {alternative}: which should you choose?',
        'Why I switched from {oldTech} to {technology}',
        'Comparing {technology} performance across different scenarios',
        'The evolution of {technology}: past, present, and future',
        '{technology} ecosystem: tools and libraries you should know',
        'Cost analysis: {technology} vs traditional approaches',
        'Learning curve: mastering {technology} fundamentals',
        '{technology} in different industries: use cases and examples',
        'Open source alternatives to {technology}',
        'Enterprise adoption of {technology}: trends and insights',
        'Community and support: why {technology} is thriving',
        'Developer experience with {technology}: pros and cons',
        'Performance benchmarks: {technology} under load',
        'Security analysis of {technology} implementations',
        'Maintenance and long-term support for {technology}',
        'Integration challenges with {technology}',
        'Deployment strategies for {technology} applications',
        'Vendor lock-in considerations with {technology}',
        'Compliance and regulatory aspects of {technology}',
        'Total cost of ownership: {technology} analysis',

        // Implementation & How-To (25+ templates)
        'How to implement {topic} using {technology}',
        'Step-by-step guide to {technology} setup and configuration',
        'Building your first {project} with {technology}',
        'Advanced {technology} techniques for {topic}',
        'Optimizing {technology} for {metric} improvements',
        'Solving {issue} in {technology}: multiple approaches',
        'Custom {technology} solutions for complex requirements',
        'Integrating {technology} with existing systems',
        'Automated testing setup for {technology} projects',
        'CI/CD pipeline configuration for {technology}',
        'Docker containerization of {technology} applications',
        'Kubernetes deployment strategies for {technology}',
        'Monitoring and alerting for {technology} services',
        'Backup and disaster recovery with {technology}',
        'Multi-environment setup with {technology}',
        'Database migration strategies using {technology}',
        'API versioning approaches in {technology}',
        'Authentication and authorization with {technology}',
        'Rate limiting and throttling in {technology}',
        'Logging and audit trails with {technology}',
        'Configuration management for {technology}',
        'Secret management in {technology} applications',
        'Health checks and service discovery with {technology}',
        'Blue-green deployment with {technology}',
        'A/B testing implementation using {technology}',

        // Problem-Solving & Troubleshooting (25+ templates)
        'Troubleshooting common {technology} issues',
        'Debugging {technology}: tools and methodologies',
        'Performance bottlenecks in {technology}: identification and solutions',
        'Memory leaks in {technology}: detection and prevention',
        'Network issues with {technology}: diagnosis and fixes',
        'Database connection problems in {technology}',
        'Authentication failures in {technology} applications',
        'Deployment issues with {technology}: common causes',
        'Configuration errors in {technology}: how to avoid them',
        'Scaling problems with {technology}: solutions that work',
        'Security vulnerabilities in {technology}: assessment and mitigation',
        'Data corruption issues in {technology} systems',
        'Integration failures with {technology}: debugging approaches',
        'Performance degradation in {technology}: root cause analysis',
        'Error handling improvements in {technology}',
        'Timeout issues in {technology}: configuration and solutions',
        'Resource exhaustion in {technology}: monitoring and prevention',
        'Compatibility issues with {technology} versions',
        'Third-party integration problems with {technology}',
        'Load testing {technology}: identifying breaking points',
        'Capacity planning for {technology} systems',
        'Incident response procedures for {technology}',
        'Rollback strategies for {technology} deployments',
        'Data recovery procedures with {technology}',
        'Emergency fixes for {technology} in production'
      ],
      learning: [
        'Learning {technology} - my journey so far',
        'Resources that helped me master {technology}',
        'Common mistakes when starting with {technology}',
        'From zero to hero: {technology} learning path',
        'Why I chose {technology} over {alternative}',
        'Understanding {concept} in {technology}',
        'Building my first {project} with {technology}',
        'Lessons learned from {timeframe} of {technology}'
      ],
      showcase: [
        'Built an amazing {project} using {technology}',
        'Open sourcing my {project} built with {technology}',
        'Side project: {description} with {technology}',
        'Portfolio update: new {project} featuring {technology}',
        'Just shipped: {project} powered by {technology}',
        'Weekend project: exploring {technology} capabilities',
        'From idea to deployment: my {project} story',
        'Rebuilt my {project} with {technology} - huge improvements!'
      ],
      question: [
        'Best practices for {topic} in {technology}?',
        'How do you handle {challenge} with {technology}?',
        'Struggling with {concept} in {technology} - need advice',
        'What are your thoughts on {technology} vs {alternative}?',
        'Anyone experienced with {topic} in {technology}?',
        'Looking for recommendations: {technology} {resource}',
        'How to optimize {metric} in {technology} applications?',
        'Debugging {issue} in {technology} - any ideas?'
      ],
      career: [
        'Landed my first {role} role working with {technology}',
        'Career transition: from {oldRole} to {newRole}',
        'Interview tips for {technology} positions',
        'Salary negotiation as a {role} developer',
        'Remote work experience as a {technology} developer',
        'Building a portfolio for {technology} roles',
        'Networking tips for {technology} professionals',
        'Skills that got me hired as a {role}'
      ]
    };

    this.projectTypes = [
      // Business & E-commerce (20+ options)
      'e-commerce platform',
      'marketplace',
      'auction site',
      'subscription service',
      'payment gateway',
      'inventory management',
      'CRM system',
      'ERP solution',
      'accounting software',
      'invoicing system',
      'point of sale',
      'loyalty program',
      'customer support',
      'help desk',
      'ticketing system',
      'project management',
      'task tracker',
      'time tracking',
      'expense management',
      'budget planner',

      // Social & Communication (20+ options)
      'social media app',
      'messaging platform',
      'video chat',
      'forum',
      'community platform',
      'dating app',
      'networking tool',
      'collaboration tool',
      'team communication',
      'event planning',
      'meetup organizer',
      'social calendar',
      'photo sharing',
      'video sharing',
      'live streaming',
      'podcast platform',
      'blog platform',
      'content management',
      'wiki system',
      'knowledge base',

      // Productivity & Tools (20+ options)
      'productivity suite',
      'note-taking app',
      'document editor',
      'spreadsheet tool',
      'presentation maker',
      'mind mapping',
      'diagram creator',
      'flowchart tool',
      'code editor',
      'IDE plugin',
      'development tool',
      'debugging tool',
      'testing framework',
      'automation tool',
      'deployment tool',
      'monitoring dashboard',
      'analytics platform',
      'reporting tool',
      'data visualization',
      'dashboard builder',

      // Entertainment & Media (20+ options)
      'music player',
      'video player',
      'streaming service',
      'podcast app',
      'audiobook player',
      'radio app',
      'music discovery',
      'playlist generator',
      'game platform',
      'puzzle game',
      'arcade game',
      'strategy game',
      'educational game',
      'trivia app',
      'quiz platform',
      'learning management',
      'course platform',
      'tutorial system',
      'skill assessment',
      'certification tool',

      // Lifestyle & Personal (20+ options)
      'fitness tracker',
      'workout planner',
      'nutrition tracker',
      'meal planner',
      'recipe finder',
      'cooking assistant',
      'grocery list',
      'shopping assistant',
      'travel planner',
      'trip organizer',
      'booking system',
      'reservation tool',
      'calendar app',
      'reminder system',
      'habit tracker',
      'goal tracker',
      'journal app',
      'mood tracker',
      'meditation app',
      'wellness platform',

      // Technical & Development (20+ options)
      'API service',
      'microservice',
      'web scraper',
      'data pipeline',
      'ETL tool',
      'database tool',
      'migration tool',
      'backup system',
      'security scanner',
      'vulnerability checker',
      'performance monitor',
      'log analyzer',
      'metrics collector',
      'alerting system',
      'notification service',
      'email service',
      'SMS gateway',
      'push notification',
      'webhook service',
      'integration platform'
    ];

    this.challenges = [
      'performance bottlenecks',
      'memory leaks',
      'scaling issues',
      'authentication',
      'data consistency',
      'error handling',
      'testing coverage',
      'deployment',
      'security vulnerabilities',
      'API design',
      'database optimization',
      'caching',
      'monitoring',
      'logging',
      'documentation',
      'code organization'
    ];
  }

  initializeGeographicData() {
    this.timezones = {
      usa: [
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles'
      ],
      europe: [
        'Europe/London',
        'Europe/Berlin',
        'Europe/Paris',
        'Europe/Rome',
        'Europe/Madrid'
      ],
      asia: [
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Mumbai',
        'Asia/Seoul',
        'Asia/Singapore'
      ],
      global: [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
        'America/Sao_Paulo'
      ]
    };
  }

  generateUser(index) {
    const seed = this.createSeed(`user_${index}`);
    faker.seed(parseInt(seed.substring(0, 8), 16));

    const persona = this.selectPersona(seed);
    const industry = this.selectIndustry();

    const profile = this.generateUserProfile(persona, industry);

    // Generate NextAuth compatible data
    const providers = ['twitch', 'discord', 'github'];
    const provider = faker.helpers.arrayElement(providers);
    const providerAccountId = `${provider}_${index.toString().padStart(8, '0')}`;

    const joinDate = this.generateJoinDate();

    return {
      // NextAuth user fields
      name: profile.username,
      email: `${profile.firstName.toLowerCase()}.${profile.lastName.toLowerCase()}+${index}@example.com`,
      image: faker.image.avatar(),
      profile_public: true,

      // Account fields
      provider: provider,
      providerAccountId: providerAccountId,

      // Additional data for content generation
      persona: persona,
      industry: industry,
      profile: profile,
      created_at: joinDate,
      seed: seed
    };
  }

  generateUserProfile(persona, industry) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    // Enhanced username formats including typical third-party auth formats
    const usernameFormats = [
      // Standard formats
      `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
      `${firstName.toLowerCase()}${faker.number.int({ min: 10, max: 999 })}`,

      // Third-party auth typical formats (Google, GitHub, etc.)
      `${firstName} ${lastName}`, // Full name with space (common in Google auth)
      `${firstName.toLowerCase()} ${lastName.toLowerCase()}`, // Lowercase with space
      `${firstName} ${lastName.charAt(0)}.`, // First name + last initial
      `${firstName.charAt(0)}. ${lastName}`, // First initial + last name
      `${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}`, // firstname + last initial

      // Professional formats
      `${firstName}.${lastName}@${faker.helpers.arrayElement(['dev', 'tech', 'code'])}`,
      `${firstName}_${lastName}_${faker.helpers.arrayElement(['dev', 'engineer', 'coder'])}`,

      // Tech-focused formats
      `${industry.technologies[0].toLowerCase()}_${firstName.toLowerCase()}`,
      `${persona.type.split('_')[0]}${faker.number.int({ min: 10, max: 9999 })}`,
      `${faker.hacker.noun()}${faker.number.int({ min: 10, max: 999 })}`,
      `${faker.company.buzzNoun()}${faker.number.int({ min: 10, max: 99 })}`,

      // Modern formats
      `${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      `${firstName.toLowerCase()}+${lastName.toLowerCase()}`,
      `${lastName.toLowerCase()}.${firstName.toLowerCase()}`,

      // Abbreviated formats
      `${firstName.substring(0, 3)}${lastName.substring(0, 3)}${faker.number.int({ min: 10, max: 99 })}`,
      `${firstName.charAt(0)}${lastName}${faker.number.int({ min: 1000, max: 9999 })}`,

      // International formats
      `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${faker.number.int({ min: 10, max: 99 })}`,
      `${lastName.toLowerCase()}_${firstName.charAt(0).toLowerCase()}`
    ];

    let username = faker.helpers.arrayElement(usernameFormats);

    // Clean username for database storage (remove special chars except allowed ones)
    // But preserve spaces for third-party auth formats
    if (username.includes(' ') && Math.random() < 0.3) {
      // Keep some usernames with spaces (typical of Google/Facebook auth)
      username = username.substring(0, 50);
    } else {
      // Clean for traditional username format
      username = username.replace(/[^a-z0-9._\-+@]/g, '').substring(0, 50);
    }

    return {
      username: username,
      firstName: firstName,
      lastName: lastName,
      location: this.generateLocation(),
      bio: this.generateBio(persona, industry)
    };
  }

  generateLocation() {
    const locationMap = {
      usa: () => `${faker.location.city()}, ${faker.location.state()}`,
      europe: () =>
        `${faker.location.city()}, ${faker.helpers.arrayElement(['UK', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands'])}`,
      asia: () =>
        `${faker.location.city()}, ${faker.helpers.arrayElement(['Japan', 'China', 'India', 'South Korea', 'Singapore'])}`,
      global: () => `${faker.location.city()}, ${faker.location.country()}`
    };

    return (
      locationMap[this.config.geographicDistribution] || locationMap.global()
    );
  }

  generateBio(persona, industry) {
    const roles = {
      senior_engineer: [
        'Senior Software Engineer',
        'Principal Engineer',
        'Staff Engineer'
      ],
      junior_developer: [
        'Software Developer',
        'Junior Developer',
        'Frontend Developer'
      ],
      tech_lead: ['Tech Lead', 'Engineering Manager', 'Team Lead'],
      freelancer: [
        'Freelance Developer',
        'Independent Consultant',
        'Full-Stack Developer'
      ],
      student: [
        'Computer Science Student',
        'Bootcamp Graduate',
        'Aspiring Developer'
      ],
      designer_dev: [
        'UI/UX Developer',
        'Creative Developer',
        'Design Engineer'
      ],
      data_scientist: ['Data Scientist', 'ML Engineer', 'Data Analyst']
    };

    const role = faker.helpers.arrayElement(roles[persona.type]);
    const tech = faker.helpers.arrayElement(industry.technologies);
    const company = faker.company.name();

    const bioTemplates = [
      `${role} at ${company}. Passionate about ${tech} and ${faker.helpers.arrayElement(industry.topics)}.`,
      `Building amazing things with ${tech}. ${role} with ${faker.number.int({ min: 1, max: 15 })} years experience.`,
      `${role} | ${tech} enthusiast | ${faker.helpers.arrayElement(['Coffee addict', 'Open source contributor', 'Remote work advocate'])}`,
      `Currently ${faker.helpers.arrayElement(['working on', 'building', 'exploring'])} ${faker.helpers.arrayElement(this.projectTypes)} with ${tech}.`
    ];

    return faker.helpers.arrayElement(bioTemplates);
  }

  generateJoinDate() {
    const distributionMap = {
      recent: () => faker.date.recent({ days: 90 }),
      spread: () => faker.date.past({ years: 3 }),
      natural: () => {
        // More realistic distribution - most users joined in last 2 years
        const weights = [0.4, 0.3, 0.2, 0.1]; // Recent to old
        const periods = [90, 365, 730, 1095]; // Days
        const selectedPeriod = faker.helpers.weightedArrayElement(
          periods.map((days, i) => ({ weight: weights[i], value: days }))
        );
        return faker.date.recent({ days: selectedPeriod });
      }
    };

    const selectedFunction =
      distributionMap[this.config.temporalDistribution] ||
      distributionMap.natural;
    return selectedFunction();
  }

  generatePostDate(userJoinDate) {
    try {
      // Posts should be created after the user joined
      const joinTime = new Date(userJoinDate).getTime();
      const now = Date.now();

      // Validate join time
      if (isNaN(joinTime) || joinTime >= now) {
        // If join date is invalid or in the future, use recent past
        return faker.date.recent({ days: 30 });
      }

      const distributionMap = {
        recent: () => faker.date.recent({ days: 30 }),
        spread: () => {
          // Posts spread between join date and now
          const timeRange = now - joinTime;
          const randomOffset = Math.random() * timeRange;
          const resultDate = new Date(joinTime + randomOffset);

          // Validate result
          if (isNaN(resultDate.getTime())) {
            return faker.date.recent({ days: 30 });
          }
          return resultDate;
        },
        natural: () => {
          // More posts in recent months, some older posts
          const daysSinceJoin = Math.floor(
            (now - joinTime) / (1000 * 60 * 60 * 24)
          );
          const maxDays = Math.max(1, Math.min(daysSinceJoin, 365)); // Cap at 1 year, min 1

          // Weighted towards recent posts
          const weights = [0.5, 0.3, 0.2]; // Recent, medium, old
          const periods = [
            Math.min(30, maxDays),
            Math.min(90, maxDays),
            maxDays
          ];

          const selectedPeriod = faker.helpers.weightedArrayElement(
            periods.map((days, i) => ({ weight: weights[i], value: days }))
          );

          return faker.date.recent({ days: selectedPeriod });
        }
      };

      const selectedFunction =
        distributionMap[this.config.temporalDistribution] ||
        distributionMap.natural;

      const result = selectedFunction();

      // Final validation
      if (!result || isNaN(result.getTime())) {
        return faker.date.recent({ days: 30 });
      }

      return result;
    } catch (error) {
      console.warn(
        'Error generating post date, using fallback:',
        error.message
      );
      return faker.date.recent({ days: 30 });
    }
  }

  selectIndustry() {
    if (this.config.industryFocus === 'mixed') {
      return faker.helpers.weightedArrayElement(
        Object.entries(this.mixedIndustryWeights).map(([industry, weight]) => ({
          weight,
          value: this.industries[industry]
        }))
      );
    }

    return this.industries[this.config.industryFocus] || this.industries.web;
  }

  selectPersona(seed) {
    const adjustedPersonas = this.adjustPersonaWeights();
    const random = this.seededRandom(seed, 0);
    let cumulative = 0;

    for (const persona of adjustedPersonas) {
      cumulative += persona.weight;
      if (random <= cumulative) {
        return persona;
      }
    }

    return adjustedPersonas[0];
  }

  adjustPersonaWeights() {
    const adjustments = {
      'junior-heavy': {
        junior_developer: 1.5,
        student: 1.3,
        senior_engineer: 0.7,
        tech_lead: 0.6
      },
      'senior-heavy': {
        senior_engineer: 1.4,
        tech_lead: 1.3,
        junior_developer: 0.8,
        student: 0.7
      },
      realistic: {} // No adjustments
    };

    const adjustment = adjustments[this.config.experienceDistribution] || {};

    return this.personas.map((persona) => ({
      ...persona,
      weight: persona.weight * (adjustment[persona.type] || 1)
    }));
  }

  generateContent(user, index, allUsers = []) {
    faker.seed(parseInt(user.seed.substring(8, 16), 16) + index);

    const contentType = faker.helpers.arrayElement(user.persona.contentTypes);
    const template = faker.helpers.arrayElement(
      this.contentTemplates[contentType]
    );

    let content = this.fillTemplate(template, user, contentType);

    // Add user mentions 30% of the time
    if (Math.random() < 0.3 && allUsers.length > 0) {
      content = this.addUserMentions(content, user, allUsers);
    }

    const hashtags = this.generateHashtags(user, contentType, content);

    return {
      content: content,
      hashtags: hashtags,
      contentType: contentType,
      engagement: this.calculateEngagementPotential(user, contentType)
    };
  }

  fillTemplate(template, user, contentType) {
    const industry = user.industry;
    const replacements = {
      technology: faker.helpers.arrayElement(industry.technologies),
      topic: faker.helpers.arrayElement(industry.topics),
      framework: faker.helpers.arrayElement(
        industry.frameworks || industry.technologies
      ),
      project: faker.helpers.arrayElement(this.projectTypes),
      challenge: faker.helpers.arrayElement(this.challenges),
      concept: faker.helpers.arrayElement([
        ...industry.topics,
        ...industry.technologies
      ]),
      oldTech: faker.helpers.arrayElement(industry.technologies),
      alternative: faker.helpers.arrayElement(industry.technologies),
      role: this.getRoleForPersona(user.persona.type),
      oldRole: faker.helpers.arrayElement([
        'Junior Developer',
        'Intern',
        'Student'
      ]),
      newRole: faker.helpers.arrayElement([
        'Senior Developer',
        'Tech Lead',
        'Architect'
      ]),
      resource: faker.helpers.arrayElement([
        'tutorial',
        'course',
        'book',
        'documentation'
      ]),
      timeframe: faker.helpers.arrayElement(['6 months', '1 year', '2 years']),
      metric: faker.helpers.arrayElement([
        'performance',
        'security',
        'scalability'
      ]),
      issue: faker.helpers.arrayElement([
        'memory leak',
        'slow queries',
        'race condition'
      ]),
      description: faker.helpers.arrayElement([
        'innovative',
        'user-friendly',
        'scalable',
        'modern'
      ])
    };

    let content = template;
    Object.entries(replacements).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    // Add persona-specific tone
    const toneWord = faker.helpers.arrayElement(user.persona.toneKeywords);
    if (Math.random() < 0.3) {
      content += ` Perfect for ${toneWord} focused development.`;
    }

    return content;
  }

  getRoleForPersona(personaType) {
    const roleMap = {
      senior_engineer: 'Senior Engineer',
      junior_developer: 'Junior Developer',
      tech_lead: 'Tech Lead',
      freelancer: 'Freelancer',
      student: 'Student',
      designer_dev: 'Designer',
      data_scientist: 'Data Scientist'
    };
    return roleMap[personaType] || 'Developer';
  }

  generateHashtags(user, contentType, content) {
    const baseHashtags = [...user.industry.hashtags];
    const contentWords = content.toLowerCase().split(' ');

    // Extract relevant technologies mentioned in content
    const mentionedTech = user.industry.technologies
      .filter((tech) =>
        contentWords.some((word) => word.includes(tech.toLowerCase()))
      )
      .map((tech) => tech.toLowerCase().replace(/[^a-z0-9]/g, ''));

    // Add content-type specific hashtags
    const typeHashtags = {
      technical: ['programming', 'coding', 'development', 'tech'],
      learning: ['learning', 'tutorial', 'education', 'tips'],
      showcase: ['project', 'portfolio', 'opensource', 'buildinpublic'],
      question: ['help', 'advice', 'community', 'discussion'],
      career: ['career', 'jobs', 'hiring', 'professional']
    };

    const allPossibleHashtags = [
      ...baseHashtags,
      ...mentionedTech,
      ...typeHashtags[contentType],
      // Add some general tech hashtags
      'dev',
      'developer',
      'programming',
      'code',
      'tech',
      'software'
    ];

    // Select hashtags based on complexity setting
    const complexityMap = {
      low: 2,
      medium: 3,
      high: 4,
      varied: faker.number.int({ min: 2, max: 5 })
    };

    const numHashtags = complexityMap[user.persona.complexity] || 3;
    const selectedHashtags = faker.helpers.arrayElements(
      [...new Set(allPossibleHashtags)],
      Math.min(numHashtags, allPossibleHashtags.length)
    );

    return selectedHashtags;
  }

  addUserMentions(content, currentUser, allUsers) {
    // Don't mention yourself
    const otherUsers = allUsers.filter((u) => u.id !== currentUser.id);
    if (otherUsers.length === 0) return content;

    // Randomly select 1-3 users to mention
    const numMentions = Math.min(
      faker.number.int({ min: 1, max: 3 }),
      otherUsers.length
    );
    const mentionedUsers = faker.helpers.arrayElements(otherUsers, numMentions);

    // Add mentions naturally to the content
    const mentionTemplates = [
      `Thanks @{username} for the insights!`,
      `@{username} what do you think about this?`,
      `As @{username} mentioned earlier,`,
      `Great point @{username}!`,
      `@{username} might have experience with this.`,
      `Similar to what @{username} suggested,`,
      `@{username} @{username2} thoughts?`
    ];

    const template = faker.helpers.arrayElement(mentionTemplates);
    let mentionText = template;

    // Replace placeholders with structured mentions (prevents false positives)
    mentionedUsers.forEach((user, index) => {
      const placeholder = index === 0 ? '{username}' : `{username${index + 1}}`;
      const filterType = Math.random() < 0.7 ? 'author' : 'mentions'; // 70% author, 30% mentions
      const structuredMention = `@[${user.name}|${user.id}|${filterType}]`;
      mentionText = mentionText.replace(placeholder, structuredMention);
    });

    // Remove any unused placeholders
    mentionText = mentionText.replace(/@\{username\d*\}/g, '').trim();

    // Add mention to content (50% at start, 50% at end)
    if (Math.random() < 0.5) {
      return `${mentionText} ${content}`;
    } else {
      return `${content} ${mentionText}`;
    }
  }

  calculateEngagementPotential(user, contentType) {
    const baseScores = {
      showcase: 0.8,
      question: 0.9,
      learning: 0.7,
      technical: 0.6,
      career: 0.5
    };

    const personaMultipliers = {
      junior_developer: 1.2,
      student: 1.1,
      senior_engineer: 0.9,
      tech_lead: 0.8,
      freelancer: 1.0,
      designer_dev: 1.1,
      data_scientist: 0.9
    };

    return (
      (baseScores[contentType] || 0.6) *
      (personaMultipliers[user.persona.type] || 1.0)
    );
  }

  generateReply(user, parentPost, index, threadDepth = 1) {
    faker.seed(parseInt(user.seed.substring(16, 24), 16) + index);

    const parentWords = parentPost.submission_name
      .split(' ')
      .filter((word) => word.length > 3 && !word.startsWith('#'));

    const contextWord =
      faker.helpers.arrayElement(parentWords) || 'development';
    const industry = user.industry;

    // Different reply types based on thread depth and persona
    const replyTypes = this.getReplyTypes(threadDepth, user.persona.type);
    const replyType = faker.helpers.arrayElement(replyTypes);

    let reply = this.generateReplyByType(
      replyType,
      contextWord,
      industry,
      user,
      parentPost
    );

    // Add complexity based on persona and depth
    if (threadDepth > 2 && Math.random() < 0.4) {
      reply += this.addComplexityToReply(user, industry, threadDepth);
    }

    // Occasionally add hashtags to replies (probability decreases with depth)
    const hashtagProbability = Math.max(0.1, 0.4 - threadDepth * 0.1);
    if (Math.random() < hashtagProbability) {
      const hashtag = faker.helpers.arrayElement(industry.hashtags);
      reply += ` #${hashtag}`;
    }

    return reply;
  }

  getReplyTypes(depth, personaType) {
    const baseTypes = [
      'supportive',
      'questioning',
      'technical',
      'experiential'
    ];

    if (depth === 1) {
      return [...baseTypes, 'detailed', 'contrasting'];
    } else if (depth === 2) {
      return [...baseTypes, 'clarifying', 'building'];
    } else if (depth >= 3) {
      return ['brief', 'agreement', 'final_thought', 'technical_detail'];
    }

    return baseTypes;
  }

  generateReplyByType(type, contextWord, industry, user, parentPost) {
    const templates = {
      supportive: [
        `Great insights on ${contextWord}! I've had similar experiences with ${faker.helpers.arrayElement(industry.technologies)}.`,
        `Really appreciate you sharing this perspective on ${contextWord}. It's exactly what I needed to hear.`,
        `This is spot on! ${contextWord} can be tricky but your approach makes sense.`,
        `Excellent point about ${contextWord}. I've seen this work really well in production.`
      ],
      questioning: [
        `Thanks for sharing this! How do you handle ${faker.helpers.arrayElement(this.challenges)} in this context?`,
        `Interesting approach with ${contextWord}. Have you considered the ${faker.helpers.arrayElement(
          ['security', 'performance', 'scalability']
        )} implications?`,
        `This is helpful! What's your experience with ${contextWord} at scale?`,
        `Good point on ${contextWord}. How would this work with ${faker.helpers.arrayElement(industry.technologies)}?`
      ],
      technical: [
        `Building on this, ${contextWord} works really well when combined with ${faker.helpers.arrayElement(industry.frameworks || industry.technologies)}.`,
        `I've implemented something similar with ${contextWord}. The key is ${faker.helpers.arrayElement(
          [
            'performance optimization',
            'proper error handling',
            'comprehensive testing'
          ]
        )}.`,
        `For ${contextWord}, I'd also recommend considering ${faker.helpers.arrayElement(industry.technologies)} for better ${faker.helpers.arrayElement(
          ['performance', 'maintainability', 'scalability']
        )}.`,
        `Technical note on ${contextWord}: make sure to handle ${faker.helpers.arrayElement(['edge cases', 'error states', 'memory management'])} properly.`
      ],
      experiential: [
        `This reminds me of a ${faker.helpers.arrayElement(this.projectTypes)} I built using ${faker.helpers.arrayElement(industry.technologies)}.`,
        `I ran into something similar with ${contextWord} last year. What worked for me was ${faker.helpers.arrayElement(
          [
            'refactoring the architecture',
            'switching to a different approach',
            'optimizing the algorithm'
          ]
        )}.`,
        `Been there with ${contextWord}! The learning curve was steep but totally worth it.`,
        `My team faced this exact ${contextWord} challenge. We ended up using ${faker.helpers.arrayElement(industry.technologies)} and it solved everything.`
      ],
      detailed: [
        `Expanding on ${contextWord}: I've found that ${faker.helpers.arrayElement(industry.technologies)} provides better ${faker.helpers.arrayElement(
          ['performance', 'developer experience', 'maintainability']
        )} compared to alternatives. The key considerations are ${faker.helpers.arrayElement(
          ['implementation complexity', 'learning curve', 'community support']
        )}.`,
        `Deep dive into ${contextWord}: From my experience, the biggest challenges are ${faker.helpers.arrayElement(
          ['state management', 'data consistency', 'error handling']
        )}. I'd recommend starting with ${faker.helpers.arrayElement(industry.technologies)} and gradually optimizing.`,
        `Comprehensive analysis of ${contextWord}: The approach you mentioned works well, but consider these factors: ${faker.helpers.arrayElement(
          ['scalability requirements', 'team expertise', 'maintenance overhead']
        )}. In my projects, ${faker.helpers.arrayElement(industry.technologies)} has been a game-changer.`
      ],
      contrasting: [
        `Interesting take on ${contextWord}. I've had different results with ${faker.helpers.arrayElement(industry.technologies)} - found it better for ${faker.helpers.arrayElement(['large-scale applications', 'rapid prototyping', 'team collaboration'])}.`,
        `While I agree with most points about ${contextWord}, I'd argue that ${faker.helpers.arrayElement(industry.technologies)} might be overkill for ${faker.helpers.arrayElement(['small projects', 'simple use cases', 'proof of concepts'])}.`,
        `Alternative perspective on ${contextWord}: Have you tried ${faker.helpers.arrayElement(industry.technologies)}? It might address some of the limitations you mentioned.`
      ],
      clarifying: [
        `Just to clarify on ${contextWord} - are you referring to ${faker.helpers.arrayElement(['the latest version', 'the enterprise edition', 'the open-source variant'])}?`,
        `Quick question about ${contextWord}: How does this compare to ${faker.helpers.arrayElement(industry.technologies)}?`,
        `To make sure I understand ${contextWord} correctly - you're suggesting ${faker.helpers.arrayElement(['a complete rewrite', 'incremental migration', 'hybrid approach'])}?`
      ],
      building: [
        `Building on your ${contextWord} point: ${faker.helpers.arrayElement(industry.technologies)} also offers ${faker.helpers.arrayElement(['better performance', 'improved security', 'enhanced developer experience'])}.`,
        `Adding to the ${contextWord} discussion: Don't forget about ${faker.helpers.arrayElement(['testing strategies', 'deployment considerations', 'monitoring requirements'])}.`,
        `Extending your ${contextWord} idea: This pairs really well with ${faker.helpers.arrayElement(industry.technologies)} for ${faker.helpers.arrayElement(['production environments', 'enterprise applications', 'high-traffic scenarios'])}.`
      ],
      brief: [
        `Exactly this! ${contextWord} is crucial.`,
        `+1 on ${contextWord}. Game changer.`,
        `This! ${contextWord} solved everything for me.`,
        `Perfect explanation of ${contextWord}.`,
        `Couldn't agree more on ${contextWord}.`
      ],
      agreement: [
        `Absolutely agree with this ${contextWord} approach.`,
        `This is the way to handle ${contextWord}.`,
        `Spot on about ${contextWord}!`,
        `Exactly my experience with ${contextWord}.`
      ],
      final_thought: [
        `Final thought on ${contextWord}: it's all about finding the right balance.`,
        `Bottom line with ${contextWord}: ${faker.helpers.arrayElement(['it works', 'worth the investment', 'solid choice'])}.`,
        `At the end of the day, ${contextWord} comes down to ${faker.helpers.arrayElement(['team preferences', 'project requirements', 'long-term maintenance'])}.`
      ],
      technical_detail: [
        `Technical detail: ${contextWord} requires ${faker.helpers.arrayElement(['careful memory management', 'proper error handling', 'thorough testing'])}.`,
        `Implementation note: Make sure ${contextWord} handles ${faker.helpers.arrayElement(['concurrent access', 'edge cases', 'failure scenarios'])}.`,
        `Pro tip for ${contextWord}: Always ${faker.helpers.arrayElement(['validate inputs', 'log errors', 'monitor performance'])}.`
      ]
    };

    return faker.helpers.arrayElement(templates[type] || templates.supportive);
  }

  addComplexityToReply(user, industry, depth) {
    const complexityAdditions = [
      ` I've also found that ${faker.helpers.arrayElement(industry.technologies)} integrates well here.`,
      ` Worth noting: ${faker.helpers.arrayElement(['performance', 'security', 'scalability'])} considerations are important.`,
      ` From a ${faker.helpers.arrayElement(['architectural', 'design', 'implementation'])} standpoint, this is solid.`,
      ` The ${faker.helpers.arrayElement(['community', 'documentation', 'ecosystem'])} around this is excellent.`,
      ` One gotcha: watch out for ${faker.helpers.arrayElement(['memory leaks', 'race conditions', 'edge cases'])}.`
    ];

    return faker.helpers.arrayElement(complexityAdditions);
  }

  createSeed(input) {
    return crypto.createHash('md5').update(input.toString()).digest('hex');
  }

  seededRandom(seed, index = 0) {
    const hash = crypto
      .createHash('md5')
      .update(seed + index.toString())
      .digest('hex');
    return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
  }
}

// ================================
// DATABASE OPERATIONS
// ================================

async function clearDatabase() {
  const animator = new ProgressAnimator();

  animator.start('Checking for existing data...');
  try {
    // Check if tables exist before trying to clear them
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('submissions', 'accounts', 'users')
    `;

    if (tableCheck.length === 0) {
      animator.success(
        'Database is empty (tables will be created by migrations)'
      );
      return;
    }

    animator.update('Clearing existing data...');

    // Clear in correct order to respect foreign key constraints
    // Only clear tables that exist
    const existingTables = tableCheck.map((row) => row.table_name);

    if (existingTables.includes('submissions')) {
      await sql`DELETE FROM submissions`;
      // Reset sequence only if table exists
      const seqCheck = await sql`
        SELECT 1 FROM pg_sequences WHERE sequencename = 'submissions_submission_id_seq'
      `;
      if (seqCheck.length > 0) {
        await sql`ALTER SEQUENCE submissions_submission_id_seq RESTART WITH 1`;
      }
    }

    if (existingTables.includes('accounts')) {
      await sql`DELETE FROM accounts`;
    }

    if (existingTables.includes('users')) {
      await sql`DELETE FROM users`;
      // Reset sequence only if table exists
      const seqCheck = await sql`
        SELECT 1 FROM pg_sequences WHERE sequencename = 'users_id_seq'
      `;
      if (seqCheck.length > 0) {
        await sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
      }
    }

    animator.success('Database cleared (NextAuth tables included)');
  } catch (error) {
    animator.error(`Error clearing database: ${error.message}`);
    throw error;
  }
}

async function createUsers(config, generator) {
  const animator = new ProgressAnimator();

  animator.start(
    `Creating ${chalk.bold(config.users.toLocaleString())} NextAuth users with accounts...`
  );

  const generatedUsers = [];
  const finalUsers = [];
  const updateInterval = Math.max(100, Math.floor(config.users / 100));

  // Generate user data
  for (let i = 0; i < config.users; i++) {
    generatedUsers.push(generator.generateUser(i));

    if (i % updateInterval === 0 || i === config.users - 1) {
      const progress = (((i + 1) / config.users) * 100).toFixed(1);
      animator.update(
        `Generating user data... ${chalk.bold((i + 1).toLocaleString())}/${chalk.bold(config.users.toLocaleString())} (${progress}%)`
      );
    }
  }

  // Insert users in batches
  const batchSize = 100;
  const batches = Math.ceil(generatedUsers.length / batchSize);

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, generatedUsers.length);
    const batchUsers = generatedUsers.slice(batchStart, batchEnd);

    // Prepare user records
    const userRecords = batchUsers.map((user) => [
      user.name,
      user.email,
      user.image,
      user.profile_public
    ]);

    // Insert users and get their IDs
    const insertedUsers = await sql`
      INSERT INTO users (name, email, image, profile_public)
      VALUES ${sql(userRecords)}
      RETURNING id, name, email
    `;

    // Prepare account records
    const accountRecords = [];
    for (let i = 0; i < insertedUsers.length; i++) {
      const insertedUser = insertedUsers[i];
      const generatedUser = batchUsers[i];

      // Store final user data for content generation
      finalUsers.push({
        id: insertedUser.id,
        name: insertedUser.name,
        email: insertedUser.email,
        providerAccountId: generatedUser.providerAccountId,
        persona: generatedUser.persona,
        industry: generatedUser.industry,
        profile: generatedUser.profile,
        created_at: generatedUser.created_at,
        seed: generatedUser.seed
      });

      accountRecords.push([
        insertedUser.id, // userId
        generatedUser.provider, // provider
        generatedUser.providerAccountId, // providerAccountId
        'oauth', // type
        generatedUser.providerAccountId, // access_token (placeholder)
        'Bearer', // token_type
        Math.floor(Date.now() / 1000) + 3600, // expires_at (1 hour from now)
        'read', // scope
        generatedUser.providerAccountId, // id_token (placeholder)
        'active' // session_state
      ]);
    }

    // Insert accounts
    await sql`
      INSERT INTO accounts (
        "userId", provider, "providerAccountId", type, access_token, token_type,
        expires_at, scope, id_token, session_state
      ) VALUES ${sql(accountRecords)}
    `;

    const progress = (((batch + 1) / batches) * 100).toFixed(1);
    animator.update(
      `Creating users and accounts... ${chalk.bold(batchEnd)}/${chalk.bold(generatedUsers.length)} (${progress}%)`
    );
  }

  animator.success(
    `Created ${chalk.bold(finalUsers.length.toLocaleString())} users with NextAuth accounts`
  );
  return finalUsers;
}

async function createPosts(users, config, generator) {
  const animator = new ProgressAnimator();

  animator.start(
    `Creating ${chalk.bold(config.posts.toLocaleString())} posts with realistic content...`
  );

  const batches = Math.ceil(config.posts / config.batchSize);
  let totalCreated = 0;
  const createdPosts = [];

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * config.batchSize;
    const batchSize = Math.min(config.batchSize, config.posts - batchStart);

    const posts = [];
    for (let i = 0; i < batchSize; i++) {
      const postIndex = batchStart + i;
      const user = users[postIndex % users.length];

      // Use persona posting frequency
      if (Math.random() > user.persona.postFreq) continue;

      const contentData = generator.generateContent(user, postIndex, users);

      // Generate realistic titles
      const titleTemplates = [
        contentData.content.split('.')[0] + '?',
        contentData.content.substring(0, 60) + '...',
        `${faker.helpers.arrayElement(['Tips', 'Guide', 'Tutorial', 'Experience'])}: ${contentData.content.split(' ').slice(0, 8).join(' ')}`,
        faker.helpers.arrayElement([
          'Thoughts on',
          'Experience with',
          'Deep dive into'
        ]) +
          ' ' +
          contentData.content.split(' ').slice(2, 6).join(' ')
      ];

      const title = faker.helpers.arrayElement(titleTemplates);
      const timestamp = generator.generatePostDate(user.created_at);

      posts.push({
        submission_name: contentData.content,
        submission_title: title,
        user_id: user.id, // Use NextAuth user ID
        author_provider_account_id: user.providerAccountId, // OAuth provider account ID
        tags: contentData.hashtags,
        thread_parent_id: null,
        submission_datetime: timestamp,
        engagement: contentData.engagement
      });
    }

    // Insert posts in batch
    for (const post of posts) {
      const result = await sql`
        INSERT INTO submissions (
          submission_name, submission_title, user_id, author_provider_account_id, tags, 
          thread_parent_id, submission_datetime
        ) VALUES (
          ${post.submission_name}, ${post.submission_title}, 
          ${post.user_id}, ${post.author_provider_account_id}, ${post.tags}, 
          ${post.thread_parent_id}, ${post.submission_datetime}
        ) RETURNING submission_id
      `;

      createdPosts.push({
        ...post,
        submission_id: result[0].submission_id
      });
    }

    totalCreated += posts.length;
    const progress = (((batch + 1) / batches) * 100).toFixed(1);
    animator.update(
      `Creating posts... ${chalk.bold(totalCreated.toLocaleString())}/${chalk.bold(config.posts.toLocaleString())} (${progress}%)`
    );
  }

  animator.success(
    `Created ${chalk.bold(totalCreated.toLocaleString())} posts`
  );
  return createdPosts;
}

async function createReplies(users, posts, config, generator) {
  const animator = new ProgressAnimator();

  animator.start('Creating multi-level threaded replies...');

  let totalReplies = 0;
  const allSubmissions = [...posts];
  const maxThreadDepth = 5;
  const processor = new AsyncBatchProcessor(250, 3); // Smaller batches, more concurrency

  for (let depth = 1; depth <= maxThreadDepth; depth++) {
    animator.update(`Creating depth ${depth} threaded replies...`);

    const candidateParents = allSubmissions.filter(
      (s) => !s.thread_parent_id || getThreadDepth(s, allSubmissions) < depth
    );

    if (candidateParents.length === 0) break;

    let depthReplies = 0;

    // Process in parallel batches
    const results = await processor.processBatches(
      candidateParents,
      async (batch, batchIndex) => {
        const replies = [];

        for (const parent of batch) {
          // Early exit conditions to prevent hanging
          if (replies.length > 500) break; // Prevent memory issues

          const replyProbability =
            config.replyFrequency *
            Math.pow(0.6, depth - 1) *
            (parent.engagement || 0.5);

          if (Math.random() > replyProbability) continue;

          const maxReplies = Math.max(
            1,
            Math.floor(config.maxRepliesPerPost * Math.pow(0.7, depth - 1))
          );
          const numReplies = Math.min(
            Math.floor(Math.random() * maxReplies) + 1,
            5 // Cap to prevent excessive replies
          );

          for (let j = 0; j < numReplies; j++) {
            let replyUser = faker.helpers.arrayElement(users);

            // Smart user selection (simplified to prevent hanging)
            if (depth > 1 && Math.random() < 0.2) {
              const availableUsers = users.filter(
                (u) => u.id !== parent.user_id
              );
              if (availableUsers.length > 0) {
                replyUser = faker.helpers.arrayElement(availableUsers);
              }
            }

            const adjustedReplyFreq =
              replyUser.persona.replyFreq * Math.pow(0.8, depth - 1);
            if (Math.random() > adjustedReplyFreq) continue;

            try {
              const replyContent = generator.generateReply(
                replyUser,
                parent,
                totalReplies + replies.length + j,
                depth
              );

              const hashtagMatches = replyContent.match(/#(\w+)/g) || [];
              const tags = hashtagMatches.map((tag) => tag.substring(1));

              const parentTime = new Date(parent.submission_datetime).getTime();
              const baseDelayHours = depth * 8; // Reduced delay
              const maxDelayHours = baseDelayHours + 24; // Shorter max delay
              const replyDelay =
                baseDelayHours +
                Math.random() * (maxDelayHours - baseDelayHours);
              const replyTime = new Date(
                parentTime + replyDelay * 60 * 60 * 1000
              );

              const reply = {
                submission_name: replyContent,
                submission_title: generateReplyTitle(parent, depth),
                user_id: replyUser.id, // Use NextAuth user ID
                author_provider_account_id: replyUser.providerAccountId, // OAuth provider account ID
                tags: tags,
                thread_parent_id: parent.submission_id,
                submission_datetime: replyTime,
                engagement: calculateReplyEngagement(parent, depth)
              };

              replies.push(reply);
            } catch (error) {
              console.warn(
                `Reply generation error (depth ${depth}):`,
                error.message
              );
              continue;
            }
          }
        }

        // Insert replies and return them
        const insertedReplies = [];
        for (const reply of replies) {
          try {
            const result = await sql`
              INSERT INTO submissions (
                submission_name, submission_title, user_id, author_provider_account_id, tags, 
                thread_parent_id, submission_datetime
              ) VALUES (
                ${reply.submission_name}, ${reply.submission_title}, 
                ${reply.user_id}, ${reply.author_provider_account_id}, ${reply.tags}, 
                ${reply.thread_parent_id}, ${reply.submission_datetime}
              ) RETURNING submission_id
            `;

            insertedReplies.push({
              ...reply,
              submission_id: result[0].submission_id
            });
          } catch (error) {
            console.warn('Reply insert error:', error.message);
            continue;
          }
        }

        return insertedReplies;
      },
      (completed, total) => {
        const progress = ((completed / total) * 100).toFixed(1);
        animator.update(
          `Creating depth ${depth} replies... ${chalk.bold(completed)}/${chalk.bold(total)} batches (${progress}%)`
        );
      }
    );

    // Add results to tracking
    results.forEach((reply) => {
      allSubmissions.push(reply);
      depthReplies++;
      totalReplies++;
    });

    if (depthReplies > 0) {
      animator.update(
        `Depth ${depth}: ${chalk.bold(depthReplies.toLocaleString())} replies created`
      );
      // Small delay to show the depth completion
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  animator.success(
    `Created ${chalk.bold(totalReplies.toLocaleString())} threaded replies`
  );
  return totalReplies;
}

function getThreadDepth(submission, allSubmissions) {
  if (!submission.thread_parent_id) return 0;

  const parent = allSubmissions.find(
    (s) => s.submission_id === submission.thread_parent_id
  );
  if (!parent) return 1;

  return 1 + getThreadDepth(parent, allSubmissions);
}

function getThreadParticipants(submission, allSubmissions) {
  const participants = [];
  let current = submission;

  // Walk up the thread to collect all participants
  while (current) {
    participants.push(current);
    if (!current.thread_parent_id) break;
    current = allSubmissions.find(
      (s) => s.submission_id === current.thread_parent_id
    );
  }

  return participants;
}

function generateReplyTitle(parent, depth) {
  if (depth === 1) {
    return `Re: ${parent.submission_title}`;
  } else if (depth === 2) {
    return `Re: ${parent.submission_title.replace('Re: ', '')}`;
  } else {
    return `Re: ${parent.submission_title.replace(/^Re: /, '').substring(0, 50)}...`;
  }
}

function calculateReplyEngagement(parent, depth) {
  // Engagement potential decreases with depth but varies by content
  const baseEngagement = parent.engagement || 0.5;
  const depthPenalty = Math.pow(0.8, depth - 1);
  const randomVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2

  return Math.max(0.1, baseEngagement * depthPenalty * randomVariation);
}

async function refreshMaterializedView() {
  const animator = new ProgressAnimator();

  animator.start('Refreshing materialized view...');
  try {
    await sql`SELECT refresh_user_stats()`;
    animator.success('Materialized view refreshed');
  } catch (error) {
    animator.error(`Materialized view refresh failed: ${error.message}`);
  }
}

async function displayStatistics() {
  console.log(chalk.bold.cyan('\n📊 GENERATION STATISTICS'));
  console.log(chalk.cyan('=========================='));

  try {
    const [totalSubmissions, totalUsers, mainPosts, replies] =
      await Promise.all([
        sql`SELECT COUNT(*) as count FROM submissions`,
        sql`SELECT COUNT(DISTINCT user_id) as count FROM submissions`,
        sql`SELECT COUNT(*) as count FROM submissions WHERE thread_parent_id IS NULL`,
        sql`SELECT COUNT(*) as count FROM submissions WHERE thread_parent_id IS NOT NULL`
      ]);

    console.log(
      chalk.white(
        `  ${chalk.bold('Total Records:')} ${chalk.green(totalSubmissions[0].count.toLocaleString())}`
      )
    );
    console.log(
      chalk.white(
        `  ${chalk.bold('Unique Users:')} ${chalk.blue(totalUsers[0].count.toLocaleString())}`
      )
    );
    console.log(
      chalk.white(
        `  ${chalk.bold('Main Posts:')} ${chalk.yellow(mainPosts[0].count.toLocaleString())}`
      )
    );
    console.log(
      chalk.white(
        `  ${chalk.bold('Replies:')} ${chalk.magenta(replies[0].count.toLocaleString())}`
      )
    );

    const avgReplies = replies[0].count / mainPosts[0].count;
    console.log(
      chalk.white(
        `  ${chalk.bold('Avg Replies/Post:')} ${chalk.cyan(avgReplies.toFixed(2))}`
      )
    );

    const topHashtags = await sql`
      SELECT tag, COUNT(*) as usage_count
      FROM (
        SELECT unnest(tags) as tag
        FROM submissions
        WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
      ) hashtag_usage
      GROUP BY tag
      ORDER BY usage_count DESC
      LIMIT 15
    `;

    console.log(chalk.bold.yellow('\n  🏷️  Top 15 Hashtags:'));
    topHashtags.forEach((hashtag, index) => {
      const color = index < 5 ? 'green' : index < 10 ? 'yellow' : 'gray';
      console.log(
        chalk[color](
          `    ${index + 1}. #${hashtag.tag}: ${hashtag.usage_count.toLocaleString()}`
        )
      );
    });

    // Industry distribution
    const industryTags = ['webdev', 'mobiledev', 'datascience', 'devops'];
    const industryStats = await sql`
      SELECT tag, COUNT(*) as usage_count
      FROM (
        SELECT unnest(tags) as tag
        FROM submissions
        WHERE tags IS NOT NULL
      ) hashtag_usage
      WHERE tag = ANY(${industryTags})
      GROUP BY tag
      ORDER BY usage_count DESC
    `;

    if (industryStats.length > 0) {
      console.log(chalk.bold.yellow('\n  🏭 Industry Distribution:'));
      industryStats.forEach((stat) => {
        console.log(
          chalk.blue(`    ${stat.tag}: ${stat.usage_count.toLocaleString()}`)
        );
      });
    }
  } catch (error) {
    console.error(chalk.red('❌ Error getting statistics:'), error);
  }
}

// ================================
// MAIN EXECUTION
// ================================

async function validateDatabaseSchema() {
  console.log(chalk.dim('🔍 Validating database schema...'));

  const requiredColumns = [
    {
      table: 'users',
      columns: [
        'id',
        'name',
        'email',
        'emailVerified',
        'image',
        'profile_public',
        'bio',
        'location',
        'created_at'
      ]
    },
    {
      table: 'submissions',
      columns: [
        'submission_id',
        'submission_name',
        'submission_title',
        'user_id',
        'author_provider_account_id',
        'tags',
        'thread_parent_id',
        'submission_datetime'
      ]
    },
    {
      table: 'accounts',
      columns: ['id', 'userId', 'type', 'provider', 'providerAccountId']
    }
  ];

  for (const { table, columns } of requiredColumns) {
    console.log(chalk.dim(`  Checking table: ${table}`));

    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${table}
      )
    `;

    if (!tableExists[0].exists) {
      throw new Error(
        `❌ Table '${table}' does not exist. Please run database migrations first:\n  npx tsx scripts/migrations.ts`
      );
    }

    // Check required columns
    const existingColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = ${table} 
      AND table_schema = 'public'
    `;

    const existingColumnNames = existingColumns.map((col) => col.column_name);
    const missingColumns = columns.filter(
      (col) => !existingColumnNames.includes(col)
    );

    if (missingColumns.length > 0) {
      throw new Error(
        `❌ Table '${table}' is missing required columns: ${missingColumns.join(', ')}\n  Please run database migrations first:\n  npx tsx scripts/migrations.ts`
      );
    }
  }

  console.log(chalk.green('✅ Database schema validation passed'));
}

async function main() {
  const startTime = Date.now();

  try {
    // Validate database schema before proceeding
    await validateDatabaseSchema();

    const config = new EnhancedSeedConfig();
    await config.promptForConfig();

    console.log(
      chalk.bold.green('\n🚀 Starting enhanced generation with Faker.js...')
    );

    const generator = new FakerContentGenerator(config);

    await clearDatabase();
    const users = await createUsers(config, generator);
    const posts = await createPosts(users, config, generator);
    await createReplies(users, posts, config, generator);
    await refreshMaterializedView();
    await displayStatistics();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(
      chalk.bold.green(
        `\n🎉 Generation completed in ${chalk.bold.yellow(duration)} seconds!`
      )
    );
    console.log(
      chalk.bold.cyan(`🚀 Ultra-realistic content ready for massive scale!`)
    );
    console.log(
      chalk.gray(`📈 Generated with thousands of variations using Faker.js`)
    );
  } catch (error) {
    console.error(chalk.red('❌ Generation failed:'), error);
    process.exit(1);
  } finally {
    rl.close();
    await sql.end();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  EnhancedSeedConfig,
  FakerContentGenerator
};
