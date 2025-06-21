#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * Populate Emoji Database Script
 * Populates the database with Windows and Mac emoji data
 */

// Load environment variables FIRST, before any other imports
require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');

// Create database connection AFTER environment variables are loaded
const sql = postgres({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: 'prefer',
  onnotice: () => {}, // Ignore NOTICE statements - they're not errors
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false
});

// Sample emoji data for Windows
const windowsEmojis = [
  // Faces & Expressions
  {
    emoji_id: 'grinning_face',
    unicode_codepoint: 'U+1F600',
    unicode_char: '😀',
    name: 'Grinning Face',
    description: 'A happy, grinning face',
    category: 'faces',
    tags: ['happy', 'smile', 'joy'],
    aliases: ['grinning'],
    keywords: ['happy', 'face', 'smile'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'grinning_face_with_big_eyes',
    unicode_codepoint: 'U+1F603',
    unicode_char: '😃',
    name: 'Grinning Face with Big Eyes',
    description: 'A grinning face with big eyes',
    category: 'faces',
    tags: ['happy', 'smile', 'joy'],
    aliases: ['smiley'],
    keywords: ['happy', 'face', 'smile'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'grinning_face_with_smiling_eyes',
    unicode_codepoint: 'U+1F604',
    unicode_char: '😄',
    name: 'Grinning Face with Smiling Eyes',
    description: 'A grinning face with smiling eyes',
    category: 'faces',
    tags: ['happy', 'smile', 'joy'],
    aliases: ['smile'],
    keywords: ['happy', 'face', 'smile'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'beaming_face_with_smiling_eyes',
    unicode_codepoint: 'U+1F601',
    unicode_char: '😁',
    name: 'Beaming Face with Smiling Eyes',
    description: 'A beaming face with smiling eyes',
    category: 'faces',
    tags: ['happy', 'smile', 'joy'],
    aliases: ['grin'],
    keywords: ['happy', 'face', 'smile'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'face_with_tears_of_joy',
    unicode_codepoint: 'U+1F602',
    unicode_char: '😂',
    name: 'Face with Tears of Joy',
    description: 'A face with tears of joy',
    category: 'faces',
    tags: ['happy', 'laugh', 'cry', 'joy'],
    aliases: ['joy'],
    keywords: ['happy', 'face', 'laugh'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'slightly_smiling_face',
    unicode_codepoint: 'U+1F642',
    unicode_char: '🙂',
    name: 'Slightly Smiling Face',
    description: 'A slightly smiling face',
    category: 'faces',
    tags: ['happy', 'smile'],
    aliases: ['slight_smile'],
    keywords: ['happy', 'face', 'smile'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'winking_face',
    unicode_codepoint: 'U+1F609',
    unicode_char: '😉',
    name: 'Winking Face',
    description: 'A winking face',
    category: 'faces',
    tags: ['wink', 'flirt'],
    aliases: ['wink'],
    keywords: ['wink', 'face', 'flirt'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'smiling_face_with_heart_eyes',
    unicode_codepoint: 'U+1F60D',
    unicode_char: '😍',
    name: 'Smiling Face with Heart-Eyes',
    description: 'A smiling face with heart-shaped eyes',
    category: 'faces',
    tags: ['love', 'heart', 'adore'],
    aliases: ['heart_eyes'],
    keywords: ['love', 'face', 'heart'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'face_blowing_a_kiss',
    unicode_codepoint: 'U+1F618',
    unicode_char: '😘',
    name: 'Face Blowing a Kiss',
    description: 'A face blowing a kiss',
    category: 'faces',
    tags: ['kiss', 'love', 'flirt'],
    aliases: ['kissing_heart'],
    keywords: ['kiss', 'face', 'love'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'thinking_face',
    unicode_codepoint: 'U+1F914',
    unicode_char: '🤔',
    name: 'Thinking Face',
    description: 'A thinking face',
    category: 'faces',
    tags: ['think', 'ponder', 'consider'],
    aliases: ['thinking'],
    keywords: ['think', 'face', 'ponder'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'neutral_face',
    unicode_codepoint: 'U+1F610',
    unicode_char: '😐',
    name: 'Neutral Face',
    description: 'A neutral face',
    category: 'faces',
    tags: ['neutral', 'meh'],
    aliases: ['neutral_face'],
    keywords: ['neutral', 'face', 'meh'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'expressionless_face',
    unicode_codepoint: 'U+1F611',
    unicode_char: '😑',
    name: 'Expressionless Face',
    description: 'An expressionless face',
    category: 'faces',
    tags: ['blank', 'expressionless'],
    aliases: ['expressionless'],
    keywords: ['blank', 'face', 'expressionless'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'face_without_mouth',
    unicode_codepoint: 'U+1F636',
    unicode_char: '😶',
    name: 'Face Without Mouth',
    description: 'A face without a mouth',
    category: 'faces',
    tags: ['silent', 'quiet'],
    aliases: ['no_mouth'],
    keywords: ['silent', 'face', 'quiet'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'smirking_face',
    unicode_codepoint: 'U+1F60F',
    unicode_char: '😏',
    name: 'Smirking Face',
    description: 'A smirking face',
    category: 'faces',
    tags: ['smirk', 'smug'],
    aliases: ['smirk'],
    keywords: ['smirk', 'face', 'smug'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'unamused_face',
    unicode_codepoint: 'U+1F612',
    unicode_char: '😒',
    name: 'Unamused Face',
    description: 'An unamused face',
    category: 'faces',
    tags: ['unimpressed', 'meh'],
    aliases: ['unamused'],
    keywords: ['unimpressed', 'face', 'meh'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'face_with_rolling_eyes',
    unicode_codepoint: 'U+1F644',
    unicode_char: '🙄',
    name: 'Face with Rolling Eyes',
    description: 'A face with rolling eyes',
    category: 'faces',
    tags: ['eye_roll', 'annoyed'],
    aliases: ['eye_roll'],
    keywords: ['eye_roll', 'face', 'annoyed'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'grimacing_face',
    unicode_codepoint: 'U+1F62C',
    unicode_char: '😬',
    name: 'Grimacing Face',
    description: 'A grimacing face',
    category: 'faces',
    tags: ['grimace', 'awkward'],
    aliases: ['grimacing'],
    keywords: ['grimace', 'face', 'awkward'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'lying_face',
    unicode_codepoint: 'U+1F925',
    unicode_char: '🤥',
    name: 'Lying Face',
    description: 'A lying face with long nose',
    category: 'faces',
    tags: ['lie', 'dishonest'],
    aliases: ['lying_face'],
    keywords: ['lie', 'face', 'dishonest'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'relieved_face',
    unicode_codepoint: 'U+1F60C',
    unicode_char: '😌',
    name: 'Relieved Face',
    description: 'A relieved face',
    category: 'faces',
    tags: ['relief', 'calm'],
    aliases: ['relieved'],
    keywords: ['relief', 'face', 'calm'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'pensive_face',
    unicode_codepoint: 'U+1F614',
    unicode_char: '😔',
    name: 'Pensive Face',
    description: 'A pensive face',
    category: 'faces',
    tags: ['sad', 'thoughtful'],
    aliases: ['pensive'],
    keywords: ['sad', 'face', 'thoughtful'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'sleepy_face',
    unicode_codepoint: 'U+1F62A',
    unicode_char: '😪',
    name: 'Sleepy Face',
    description: 'A sleepy face',
    category: 'faces',
    tags: ['tired', 'sleepy'],
    aliases: ['sleepy'],
    keywords: ['tired', 'face', 'sleepy'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'drooling_face',
    unicode_codepoint: 'U+1F924',
    unicode_char: '🤤',
    name: 'Drooling Face',
    description: 'A drooling face',
    category: 'faces',
    tags: ['drool', 'desire'],
    aliases: ['drooling_face'],
    keywords: ['drool', 'face', 'desire'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'sleeping_face',
    unicode_codepoint: 'U+1F634',
    unicode_char: '😴',
    name: 'Sleeping Face',
    description: 'A sleeping face',
    category: 'faces',
    tags: ['sleep', 'zzz'],
    aliases: ['sleeping'],
    keywords: ['sleep', 'face', 'zzz'],
    windows_version_min: '10'
  },

  // Gestures & Body
  {
    emoji_id: 'thumbs_up',
    unicode_codepoint: 'U+1F44D',
    unicode_char: '👍',
    name: 'Thumbs Up',
    description: 'A thumbs up gesture',
    category: 'gestures',
    tags: ['approval', 'good', 'yes'],
    aliases: ['+1', 'thumbsup'],
    keywords: ['approval', 'good', 'yes'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'thumbs_down',
    unicode_codepoint: 'U+1F44E',
    unicode_char: '👎',
    name: 'Thumbs Down',
    description: 'A thumbs down gesture',
    category: 'gestures',
    tags: ['disapproval', 'bad', 'no'],
    aliases: ['-1', 'thumbsdown'],
    keywords: ['disapproval', 'bad', 'no'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'clapping_hands',
    unicode_codepoint: 'U+1F44F',
    unicode_char: '👏',
    name: 'Clapping Hands',
    description: 'Clapping hands',
    category: 'gestures',
    tags: ['applause', 'clap', 'bravo'],
    aliases: ['clap'],
    keywords: ['applause', 'clap', 'bravo'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'raised_hands',
    unicode_codepoint: 'U+1F64C',
    unicode_char: '🙌',
    name: 'Raised Hands',
    description: 'Raised hands in celebration',
    category: 'gestures',
    tags: ['celebration', 'hooray', 'praise'],
    aliases: ['raised_hands'],
    keywords: ['celebration', 'hooray', 'praise'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'folded_hands',
    unicode_codepoint: 'U+1F64F',
    unicode_char: '🙏',
    name: 'Folded Hands',
    description: 'Folded hands in prayer',
    category: 'gestures',
    tags: ['prayer', 'thanks', 'please'],
    aliases: ['pray'],
    keywords: ['prayer', 'thanks', 'please'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'waving_hand',
    unicode_codepoint: 'U+1F44B',
    unicode_char: '👋',
    name: 'Waving Hand',
    description: 'A waving hand',
    category: 'gestures',
    tags: ['wave', 'hello', 'goodbye'],
    aliases: ['wave'],
    keywords: ['wave', 'hello', 'goodbye'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ok_hand',
    unicode_codepoint: 'U+1F44C',
    unicode_char: '👌',
    name: 'OK Hand',
    description: 'OK hand gesture',
    category: 'gestures',
    tags: ['ok', 'perfect', 'good'],
    aliases: ['ok_hand'],
    keywords: ['ok', 'perfect', 'good'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'victory_hand',
    unicode_codepoint: 'U+270C',
    unicode_char: '✌️',
    name: 'Victory Hand',
    description: 'Victory hand gesture',
    category: 'gestures',
    tags: ['victory', 'peace', 'v'],
    aliases: ['v'],
    keywords: ['victory', 'peace', 'v'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'crossed_fingers',
    unicode_codepoint: 'U+1F91E',
    unicode_char: '🤞',
    name: 'Crossed Fingers',
    description: 'Crossed fingers for luck',
    category: 'gestures',
    tags: ['luck', 'hope', 'wish'],
    aliases: ['crossed_fingers'],
    keywords: ['luck', 'hope', 'wish'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'love_you_gesture',
    unicode_codepoint: 'U+1F91F',
    unicode_char: '🤟',
    name: 'Love-You Gesture',
    description: 'I love you hand sign',
    category: 'gestures',
    tags: ['love', 'you', 'sign'],
    aliases: ['love_you_gesture'],
    keywords: ['love', 'you', 'sign'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'sign_of_the_horns',
    unicode_codepoint: 'U+1F918',
    unicode_char: '🤘',
    name: 'Sign of the Horns',
    description: 'Rock on hand gesture',
    category: 'gestures',
    tags: ['rock', 'metal', 'horns'],
    aliases: ['metal'],
    keywords: ['rock', 'metal', 'horns'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'call_me_hand',
    unicode_codepoint: 'U+1F919',
    unicode_char: '🤙',
    name: 'Call Me Hand',
    description: 'Call me hand gesture',
    category: 'gestures',
    tags: ['call', 'phone', 'shaka'],
    aliases: ['call_me_hand'],
    keywords: ['call', 'phone', 'shaka'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'flexed_biceps',
    unicode_codepoint: 'U+1F4AA',
    unicode_char: '💪',
    name: 'Flexed Biceps',
    description: 'Flexed biceps showing strength',
    category: 'gestures',
    tags: ['strong', 'muscle', 'power'],
    aliases: ['muscle'],
    keywords: ['strong', 'muscle', 'power'],
    windows_version_min: '10'
  },

  // Objects & Symbols
  {
    emoji_id: 'red_heart',
    unicode_codepoint: 'U+2764',
    unicode_char: '❤️',
    name: 'Red Heart',
    description: 'A red heart',
    category: 'objects',
    tags: ['love', 'heart', 'romance'],
    aliases: ['heart'],
    keywords: ['love', 'heart', 'romance'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'fire',
    unicode_codepoint: 'U+1F525',
    unicode_char: '🔥',
    name: 'Fire',
    description: 'Fire flame',
    category: 'objects',
    tags: ['fire', 'flame', 'hot'],
    aliases: ['fire'],
    keywords: ['fire', 'flame', 'hot'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'hundred_points',
    unicode_codepoint: 'U+1F4AF',
    unicode_char: '💯',
    name: 'Hundred Points',
    description: 'Hundred points symbol',
    category: 'objects',
    tags: ['perfect', '100', 'score'],
    aliases: ['100'],
    keywords: ['perfect', '100', 'score'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'party_popper',
    unicode_codepoint: 'U+1F389',
    unicode_char: '🎉',
    name: 'Party Popper',
    description: 'Party popper with confetti',
    category: 'objects',
    tags: ['party', 'celebration', 'confetti'],
    aliases: ['tada'],
    keywords: ['party', 'celebration', 'confetti'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'balloon',
    unicode_codepoint: 'U+1F388',
    unicode_char: '🎈',
    name: 'Balloon',
    description: 'A colorful balloon',
    category: 'objects',
    tags: ['party', 'celebration', 'balloon'],
    aliases: ['balloon'],
    keywords: ['party', 'celebration', 'balloon'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'birthday_cake',
    unicode_codepoint: 'U+1F382',
    unicode_char: '🎂',
    name: 'Birthday Cake',
    description: 'A birthday cake with candles',
    category: 'objects',
    tags: ['birthday', 'cake', 'celebration'],
    aliases: ['birthday'],
    keywords: ['birthday', 'cake', 'celebration'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'trophy',
    unicode_codepoint: 'U+1F3C6',
    unicode_char: '🏆',
    name: 'Trophy',
    description: 'A golden trophy',
    category: 'objects',
    tags: ['winner', 'award', 'champion'],
    aliases: ['trophy'],
    keywords: ['winner', 'award', 'champion'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'star',
    unicode_codepoint: 'U+2B50',
    unicode_char: '⭐',
    name: 'Star',
    description: 'A bright star',
    category: 'objects',
    tags: ['star', 'favorite', 'special'],
    aliases: ['star'],
    keywords: ['star', 'favorite', 'special'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'sparkles',
    unicode_codepoint: 'U+2728',
    unicode_char: '✨',
    name: 'Sparkles',
    description: 'Sparkles',
    category: 'objects',
    tags: ['sparkle', 'magic', 'shine'],
    aliases: ['sparkles'],
    keywords: ['sparkle', 'magic', 'shine'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'lightning_bolt',
    unicode_codepoint: 'U+26A1',
    unicode_char: '⚡',
    name: 'Lightning Bolt',
    description: 'Lightning bolt',
    category: 'objects',
    tags: ['lightning', 'electric', 'power'],
    aliases: ['zap'],
    keywords: ['lightning', 'electric', 'power'],
    windows_version_min: '10'
  },

  // Animals & Nature
  {
    emoji_id: 'dog_face',
    unicode_codepoint: 'U+1F436',
    unicode_char: '🐶',
    name: 'Dog Face',
    description: 'A cute dog face',
    category: 'animals',
    tags: ['dog', 'pet', 'animal'],
    aliases: ['dog'],
    keywords: ['dog', 'pet', 'animal'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'cat_face',
    unicode_codepoint: 'U+1F431',
    unicode_char: '🐱',
    name: 'Cat Face',
    description: 'A cute cat face',
    category: 'animals',
    tags: ['cat', 'pet', 'animal'],
    aliases: ['cat'],
    keywords: ['cat', 'pet', 'animal'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'lion',
    unicode_codepoint: 'U+1F981',
    unicode_char: '🦁',
    name: 'Lion',
    description: 'A majestic lion',
    category: 'animals',
    tags: ['lion', 'king', 'wild'],
    aliases: ['lion'],
    keywords: ['lion', 'king', 'wild'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'tiger_face',
    unicode_codepoint: 'U+1F42F',
    unicode_char: '🐯',
    name: 'Tiger Face',
    description: 'A tiger face',
    category: 'animals',
    tags: ['tiger', 'wild', 'stripes'],
    aliases: ['tiger'],
    keywords: ['tiger', 'wild', 'stripes'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'unicorn',
    unicode_codepoint: 'U+1F984',
    unicode_char: '🦄',
    name: 'Unicorn',
    description: 'A magical unicorn',
    category: 'animals',
    tags: ['unicorn', 'magic', 'fantasy'],
    aliases: ['unicorn'],
    keywords: ['unicorn', 'magic', 'fantasy'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'butterfly',
    unicode_codepoint: 'U+1F98B',
    unicode_char: '🦋',
    name: 'Butterfly',
    description: 'A beautiful butterfly',
    category: 'animals',
    tags: ['butterfly', 'beauty', 'nature'],
    aliases: ['butterfly'],
    keywords: ['butterfly', 'beauty', 'nature'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'honeybee',
    unicode_codepoint: 'U+1F41D',
    unicode_char: '🐝',
    name: 'Honeybee',
    description: 'A busy honeybee',
    category: 'animals',
    tags: ['bee', 'honey', 'busy'],
    aliases: ['bee'],
    keywords: ['bee', 'honey', 'busy'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'lady_beetle',
    unicode_codepoint: 'U+1F41E',
    unicode_char: '🐞',
    name: 'Lady Beetle',
    description: 'A lucky ladybug',
    category: 'animals',
    tags: ['ladybug', 'luck', 'insect'],
    aliases: ['ladybug'],
    keywords: ['ladybug', 'luck', 'insect'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'octopus',
    unicode_codepoint: 'U+1F419',
    unicode_char: '🐙',
    name: 'Octopus',
    description: 'An intelligent octopus',
    category: 'animals',
    tags: ['octopus', 'sea', 'tentacles'],
    aliases: ['octopus'],
    keywords: ['octopus', 'sea', 'tentacles'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'fish',
    unicode_codepoint: 'U+1F41F',
    unicode_char: '🐟',
    name: 'Fish',
    description: 'A swimming fish',
    category: 'animals',
    tags: ['fish', 'sea', 'swim'],
    aliases: ['fish'],
    keywords: ['fish', 'sea', 'swim'],
    windows_version_min: '10'
  },

  // Food & Drink
  {
    emoji_id: 'pizza',
    unicode_codepoint: 'U+1F355',
    unicode_char: '🍕',
    name: 'Pizza',
    description: 'A delicious pizza slice',
    category: 'food',
    tags: ['pizza', 'food', 'italian'],
    aliases: ['pizza'],
    keywords: ['pizza', 'food', 'italian'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'hamburger',
    unicode_codepoint: 'U+1F354',
    unicode_char: '🍔',
    name: 'Hamburger',
    description: 'A juicy hamburger',
    category: 'food',
    tags: ['burger', 'food', 'fast'],
    aliases: ['hamburger'],
    keywords: ['burger', 'food', 'fast'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'french_fries',
    unicode_codepoint: 'U+1F35F',
    unicode_char: '🍟',
    name: 'French Fries',
    description: 'Crispy french fries',
    category: 'food',
    tags: ['fries', 'food', 'fast'],
    aliases: ['fries'],
    keywords: ['fries', 'food', 'fast'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ice_cream',
    unicode_codepoint: 'U+1F368',
    unicode_char: '🍨',
    name: 'Ice Cream',
    description: 'Sweet ice cream',
    category: 'food',
    tags: ['ice_cream', 'dessert', 'cold'],
    aliases: ['ice_cream'],
    keywords: ['ice_cream', 'dessert', 'cold'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'doughnut',
    unicode_codepoint: 'U+1F369',
    unicode_char: '🍩',
    name: 'Doughnut',
    description: 'A glazed doughnut',
    category: 'food',
    tags: ['donut', 'dessert', 'sweet'],
    aliases: ['doughnut'],
    keywords: ['donut', 'dessert', 'sweet'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'cookie',
    unicode_codepoint: 'U+1F36A',
    unicode_char: '🍪',
    name: 'Cookie',
    description: 'A chocolate chip cookie',
    category: 'food',
    tags: ['cookie', 'dessert', 'sweet'],
    aliases: ['cookie'],
    keywords: ['cookie', 'dessert', 'sweet'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'coffee',
    unicode_codepoint: 'U+2615',
    unicode_char: '☕',
    name: 'Coffee',
    description: 'A hot cup of coffee',
    category: 'food',
    tags: ['coffee', 'drink', 'caffeine'],
    aliases: ['coffee'],
    keywords: ['coffee', 'drink', 'caffeine'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'beer_mug',
    unicode_codepoint: 'U+1F37A',
    unicode_char: '🍺',
    name: 'Beer Mug',
    description: 'A frothy beer mug',
    category: 'food',
    tags: ['beer', 'drink', 'alcohol'],
    aliases: ['beer'],
    keywords: ['beer', 'drink', 'alcohol'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'wine_glass',
    unicode_codepoint: 'U+1F377',
    unicode_char: '🍷',
    name: 'Wine Glass',
    description: 'A glass of red wine',
    category: 'food',
    tags: ['wine', 'drink', 'alcohol'],
    aliases: ['wine_glass'],
    keywords: ['wine', 'drink', 'alcohol'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'cocktail_glass',
    unicode_codepoint: 'U+1F378',
    unicode_char: '🍸',
    name: 'Cocktail Glass',
    description: 'A cocktail glass',
    category: 'food',
    tags: ['cocktail', 'drink', 'party'],
    aliases: ['cocktail'],
    keywords: ['cocktail', 'drink', 'party'],
    windows_version_min: '10'
  }
];

// Sample emoji data for Mac (similar to Windows but with different version requirements)
const macEmojis = windowsEmojis.map((emoji) => ({
  ...emoji,
  macos_version_min: '10.15', // Catalina and above
  windows_version_min: undefined
}));

async function populateEmojiData() {
  try {
    console.log('Starting emoji data population...');

    // Get category IDs
    const categoryResult = await sql`
      SELECT id, name FROM emoji_categories
    `;
    const categoryMap = {};
    categoryResult.forEach((row) => {
      categoryMap[row.name] = row.id;
    });

    console.log('Found categories:', Object.keys(categoryMap));

    // Insert Windows emojis
    console.log('Inserting Windows emojis...');
    for (const emoji of windowsEmojis) {
      const categoryId = categoryMap[emoji.category];
      if (!categoryId) {
        console.warn(
          `Category '${emoji.category}' not found for emoji '${emoji.name}'`
        );
        continue;
      }

      try {
        await sql`
          INSERT INTO emojis_windows (
            emoji_id, unicode_codepoint, unicode_char, name, description,
            category_id, tags, aliases, keywords, windows_version_min
          ) VALUES (
            ${emoji.emoji_id}, ${emoji.unicode_codepoint}, ${emoji.unicode_char}, 
            ${emoji.name}, ${emoji.description}, ${categoryId}, ${emoji.tags}, 
            ${emoji.aliases}, ${emoji.keywords}, ${emoji.windows_version_min}
          )
          ON CONFLICT (emoji_id) DO UPDATE SET
            unicode_codepoint = EXCLUDED.unicode_codepoint,
            unicode_char = EXCLUDED.unicode_char,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            tags = EXCLUDED.tags,
            aliases = EXCLUDED.aliases,
            keywords = EXCLUDED.keywords,
            windows_version_min = EXCLUDED.windows_version_min,
            updated_at = CURRENT_TIMESTAMP
        `;

        console.log(`✓ Inserted Windows emoji: ${emoji.name}`);
      } catch (error) {
        console.error(
          `✗ Failed to insert Windows emoji '${emoji.name}':`,
          error.message
        );
      }
    }

    // Insert Mac emojis
    console.log('Inserting Mac emojis...');
    for (const emoji of macEmojis) {
      const categoryId = categoryMap[emoji.category];
      if (!categoryId) {
        console.warn(
          `Category '${emoji.category}' not found for emoji '${emoji.name}'`
        );
        continue;
      }

      try {
        await sql`
          INSERT INTO emojis_mac (
            emoji_id, unicode_codepoint, unicode_char, name, description,
            category_id, tags, aliases, keywords, macos_version_min
          ) VALUES (
            ${emoji.emoji_id}, ${emoji.unicode_codepoint}, ${emoji.unicode_char}, 
            ${emoji.name}, ${emoji.description}, ${categoryId}, ${emoji.tags}, 
            ${emoji.aliases}, ${emoji.keywords}, ${emoji.macos_version_min}
          )
          ON CONFLICT (emoji_id) DO UPDATE SET
            unicode_codepoint = EXCLUDED.unicode_codepoint,
            unicode_char = EXCLUDED.unicode_char,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            tags = EXCLUDED.tags,
            aliases = EXCLUDED.aliases,
            keywords = EXCLUDED.keywords,
            macos_version_min = EXCLUDED.macos_version_min,
            updated_at = CURRENT_TIMESTAMP
        `;

        console.log(`✓ Inserted Mac emoji: ${emoji.name}`);
      } catch (error) {
        console.error(
          `✗ Failed to insert Mac emoji '${emoji.name}':`,
          error.message
        );
      }
    }

    // Get counts
    const windowsCount = await sql`
      SELECT COUNT(*) as count FROM emojis_windows WHERE is_active = true
    `;
    const macCount = await sql`
      SELECT COUNT(*) as count FROM emojis_mac WHERE is_active = true
    `;

    console.log(`\n✅ Emoji data population completed!`);
    console.log(`📊 Windows emojis: ${windowsCount[0].count}`);
    console.log(`📊 Mac emojis: ${macCount[0].count}`);
    console.log(
      `📊 Total emojis: ${parseInt(windowsCount[0].count) + parseInt(macCount[0].count)}`
    );
  } catch (error) {
    console.error('❌ Error populating emoji data:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the script
if (require.main === module) {
  populateEmojiData()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { populateEmojiData };
