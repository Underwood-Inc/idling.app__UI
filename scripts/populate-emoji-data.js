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

// Comprehensive emoji data for Windows
const windowsEmojis = [
  // Faces & Expressions - Positive
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

  // Faces & Expressions - Negative
  {
    emoji_id: 'confused_face',
    unicode_codepoint: 'U+1F615',
    unicode_char: '😕',
    name: 'Confused Face',
    description: 'A confused face',
    category: 'faces',
    tags: ['confused', 'puzzled'],
    aliases: ['confused'],
    keywords: ['confused', 'face', 'puzzled'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'worried_face',
    unicode_codepoint: 'U+1F61F',
    unicode_char: '😟',
    name: 'Worried Face',
    description: 'A worried face',
    category: 'faces',
    tags: ['worried', 'anxious'],
    aliases: ['worried'],
    keywords: ['worried', 'face', 'anxious'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'slightly_frowning_face',
    unicode_codepoint: 'U+1F641',
    unicode_char: '🙁',
    name: 'Slightly Frowning Face',
    description: 'A slightly frowning face',
    category: 'faces',
    tags: ['sad', 'frown'],
    aliases: ['slight_frown'],
    keywords: ['sad', 'face', 'frown'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'frowning_face',
    unicode_codepoint: 'U+2639',
    unicode_char: '☹️',
    name: 'Frowning Face',
    description: 'A frowning face',
    category: 'faces',
    tags: ['sad', 'unhappy'],
    aliases: ['frowning'],
    keywords: ['sad', 'face', 'unhappy'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'persevering_face',
    unicode_codepoint: 'U+1F623',
    unicode_char: '😣',
    name: 'Persevering Face',
    description: 'A persevering face',
    category: 'faces',
    tags: ['struggle', 'persevere'],
    aliases: ['persevere'],
    keywords: ['struggle', 'face', 'persevere'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'confounded_face',
    unicode_codepoint: 'U+1F616',
    unicode_char: '😖',
    name: 'Confounded Face',
    description: 'A confounded face',
    category: 'faces',
    tags: ['confounded', 'frustrated'],
    aliases: ['confounded'],
    keywords: ['confounded', 'face', 'frustrated'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'tired_face',
    unicode_codepoint: 'U+1F62B',
    unicode_char: '😫',
    name: 'Tired Face',
    description: 'A tired face',
    category: 'faces',
    tags: ['tired', 'exhausted'],
    aliases: ['tired_face'],
    keywords: ['tired', 'face', 'exhausted'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'weary_face',
    unicode_codepoint: 'U+1F629',
    unicode_char: '😩',
    name: 'Weary Face',
    description: 'A weary face',
    category: 'faces',
    tags: ['weary', 'tired'],
    aliases: ['weary'],
    keywords: ['weary', 'face', 'tired'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'crying_face',
    unicode_codepoint: 'U+1F622',
    unicode_char: '😢',
    name: 'Crying Face',
    description: 'A crying face',
    category: 'faces',
    tags: ['cry', 'sad', 'tear'],
    aliases: ['cry'],
    keywords: ['cry', 'face', 'sad'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'loudly_crying_face',
    unicode_codepoint: 'U+1F62D',
    unicode_char: '😭',
    name: 'Loudly Crying Face',
    description: 'A loudly crying face',
    category: 'faces',
    tags: ['sob', 'cry', 'bawl'],
    aliases: ['sob'],
    keywords: ['sob', 'face', 'cry'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'face_with_steam_from_nose',
    unicode_codepoint: 'U+1F624',
    unicode_char: '😤',
    name: 'Face with Steam From Nose',
    description: 'A face with steam from nose',
    category: 'faces',
    tags: ['angry', 'frustrated', 'steam'],
    aliases: ['triumph'],
    keywords: ['angry', 'face', 'frustrated'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'angry_face',
    unicode_codepoint: 'U+1F620',
    unicode_char: '😠',
    name: 'Angry Face',
    description: 'An angry face',
    category: 'faces',
    tags: ['angry', 'mad'],
    aliases: ['angry'],
    keywords: ['angry', 'face', 'mad'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'pouting_face',
    unicode_codepoint: 'U+1F621',
    unicode_char: '😡',
    name: 'Pouting Face',
    description: 'A pouting face',
    category: 'faces',
    tags: ['rage', 'angry', 'red'],
    aliases: ['rage'],
    keywords: ['rage', 'face', 'angry'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'face_with_symbols_on_mouth',
    unicode_codepoint: 'U+1F92C',
    unicode_char: '🤬',
    name: 'Face with Symbols on Mouth',
    description: 'A face with symbols covering the mouth',
    category: 'faces',
    tags: ['swearing', 'cursing', 'symbols'],
    aliases: ['face_with_symbols_over_mouth'],
    keywords: ['swearing', 'face', 'cursing'],
    windows_version_min: '10'
  },

  // Faces & Expressions - Special
  {
    emoji_id: 'smiling_face_with_sunglasses',
    unicode_codepoint: 'U+1F60E',
    unicode_char: '😎',
    name: 'Smiling Face with Sunglasses',
    description: 'A cool face with sunglasses',
    category: 'faces',
    tags: ['cool', 'sunglasses', 'awesome'],
    aliases: ['sunglasses'],
    keywords: ['cool', 'face', 'sunglasses'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'nerd_face',
    unicode_codepoint: 'U+1F913',
    unicode_char: '🤓',
    name: 'Nerd Face',
    description: 'A nerdy face with glasses',
    category: 'faces',
    tags: ['nerd', 'geek', 'smart'],
    aliases: ['nerd_face'],
    keywords: ['nerd', 'face', 'geek'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'face_with_monocle',
    unicode_codepoint: 'U+1F9D0',
    unicode_char: '🧐',
    name: 'Face with Monocle',
    description: 'A face with a monocle',
    category: 'faces',
    tags: ['monocle', 'thinking', 'stuffy'],
    aliases: ['monocle_face'],
    keywords: ['monocle', 'face', 'thinking'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'disguised_face',
    unicode_codepoint: 'U+1F978',
    unicode_char: '🥸',
    name: 'Disguised Face',
    description: 'A face in disguise',
    category: 'faces',
    tags: ['disguise', 'incognito', 'spy'],
    aliases: ['disguised_face'],
    keywords: ['disguise', 'face', 'incognito'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'face_with_raised_eyebrow',
    unicode_codepoint: 'U+1F928',
    unicode_char: '🤨',
    name: 'Face with Raised Eyebrow',
    description: 'A face with one raised eyebrow',
    category: 'faces',
    tags: ['skeptical', 'suspicious', 'eyebrow'],
    aliases: ['raised_eyebrow'],
    keywords: ['skeptical', 'face', 'suspicious'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'neutral_face',
    unicode_codepoint: 'U+1F610',
    unicode_char: '😐',
    name: 'Neutral Face',
    description: 'A neutral face',
    category: 'faces',
    tags: ['neutral', 'deadpan'],
    aliases: ['neutral_face'],
    keywords: ['neutral', 'face', 'deadpan'],
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
    emoji_id: 'face_with_medical_mask',
    unicode_codepoint: 'U+1F637',
    unicode_char: '😷',
    name: 'Face with Medical Mask',
    description: 'A face wearing a medical mask',
    category: 'faces',
    tags: ['mask', 'sick', 'health'],
    aliases: ['mask'],
    keywords: ['mask', 'face', 'sick'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'face_with_thermometer',
    unicode_codepoint: 'U+1F912',
    unicode_char: '🤒',
    name: 'Face with Thermometer',
    description: 'A face with a thermometer',
    category: 'faces',
    tags: ['sick', 'fever', 'ill'],
    aliases: ['face_with_thermometer'],
    keywords: ['sick', 'face', 'fever'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'face_with_head_bandage',
    unicode_codepoint: 'U+1F915',
    unicode_char: '🤕',
    name: 'Face with Head-Bandage',
    description: 'A face with a head bandage',
    category: 'faces',
    tags: ['injured', 'hurt', 'bandage'],
    aliases: ['face_with_head_bandage'],
    keywords: ['injured', 'face', 'hurt'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'nauseated_face',
    unicode_codepoint: 'U+1F922',
    unicode_char: '🤢',
    name: 'Nauseated Face',
    description: 'A nauseated face',
    category: 'faces',
    tags: ['sick', 'nausea', 'green'],
    aliases: ['nauseated_face'],
    keywords: ['sick', 'face', 'nausea'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'face_vomiting',
    unicode_codepoint: 'U+1F92E',
    unicode_char: '🤮',
    name: 'Face Vomiting',
    description: 'A face vomiting',
    category: 'faces',
    tags: ['vomit', 'sick', 'puke'],
    aliases: ['face_vomiting'],
    keywords: ['vomit', 'face', 'sick'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'sneezing_face',
    unicode_codepoint: 'U+1F927',
    unicode_char: '🤧',
    name: 'Sneezing Face',
    description: 'A sneezing face',
    category: 'faces',
    tags: ['sneeze', 'gesundheit', 'sick'],
    aliases: ['sneezing_face'],
    keywords: ['sneeze', 'face', 'sick'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'hot_face',
    unicode_codepoint: 'U+1F975',
    unicode_char: '🥵',
    name: 'Hot Face',
    description: 'A hot face',
    category: 'faces',
    tags: ['hot', 'heat', 'sweat'],
    aliases: ['hot_face'],
    keywords: ['hot', 'face', 'heat'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'cold_face',
    unicode_codepoint: 'U+1F976',
    unicode_char: '🥶',
    name: 'Cold Face',
    description: 'A cold face',
    category: 'faces',
    tags: ['cold', 'freezing', 'blue'],
    aliases: ['cold_face'],
    keywords: ['cold', 'face', 'freezing'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'woozy_face',
    unicode_codepoint: 'U+1F974',
    unicode_char: '🥴',
    name: 'Woozy Face',
    description: 'A woozy face',
    category: 'faces',
    tags: ['dizzy', 'drunk', 'woozy'],
    aliases: ['woozy_face'],
    keywords: ['dizzy', 'face', 'drunk'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'dizzy_face',
    unicode_codepoint: 'U+1F635',
    unicode_char: '😵',
    name: 'Dizzy Face',
    description: 'A dizzy face',
    category: 'faces',
    tags: ['dizzy', 'dead', 'knocked_out'],
    aliases: ['dizzy_face'],
    keywords: ['dizzy', 'face', 'dead'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'exploding_head',
    unicode_codepoint: 'U+1F92F',
    unicode_char: '🤯',
    name: 'Exploding Head',
    description: 'A head exploding',
    category: 'faces',
    tags: ['mind_blown', 'shocked', 'explosion'],
    aliases: ['exploding_head'],
    keywords: ['mind_blown', 'face', 'shocked'],
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
  },

  // ASCII Art & Text Emojis
  {
    emoji_id: 'ascii_happy',
    unicode_codepoint: 'ASCII',
    unicode_char: ':)',
    name: 'Happy Face ASCII',
    description: 'Classic ASCII happy face',
    category: 'ascii',
    tags: ['happy', 'smile', 'classic'],
    aliases: ['smile_ascii'],
    keywords: ['happy', 'ascii', 'smile'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_very_happy',
    unicode_codepoint: 'ASCII',
    unicode_char: ':D',
    name: 'Very Happy ASCII',
    description: 'Very happy ASCII face',
    category: 'ascii',
    tags: ['very_happy', 'big_smile', 'classic'],
    aliases: ['big_smile_ascii'],
    keywords: ['very_happy', 'ascii', 'big_smile'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_sad',
    unicode_codepoint: 'ASCII',
    unicode_char: ':(',
    name: 'Sad Face ASCII',
    description: 'Classic ASCII sad face',
    category: 'ascii',
    tags: ['sad', 'unhappy', 'classic'],
    aliases: ['sad_ascii'],
    keywords: ['sad', 'ascii', 'unhappy'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_wink',
    unicode_codepoint: 'ASCII',
    unicode_char: ';)',
    name: 'Wink ASCII',
    description: 'ASCII winking face',
    category: 'ascii',
    tags: ['wink', 'flirt', 'classic'],
    aliases: ['wink_ascii'],
    keywords: ['wink', 'ascii', 'flirt'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_tongue',
    unicode_codepoint: 'ASCII',
    unicode_char: ':P',
    name: 'Tongue Out ASCII',
    description: 'ASCII face with tongue out',
    category: 'ascii',
    tags: ['tongue', 'playful', 'classic'],
    aliases: ['tongue_ascii'],
    keywords: ['tongue', 'ascii', 'playful'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_surprised',
    unicode_codepoint: 'ASCII',
    unicode_char: ':O',
    name: 'Surprised ASCII',
    description: 'ASCII surprised face',
    category: 'ascii',
    tags: ['surprised', 'shocked', 'classic'],
    aliases: ['surprised_ascii'],
    keywords: ['surprised', 'ascii', 'shocked'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_neutral',
    unicode_codepoint: 'ASCII',
    unicode_char: ':|',
    name: 'Neutral ASCII',
    description: 'ASCII neutral face',
    category: 'ascii',
    tags: ['neutral', 'meh', 'classic'],
    aliases: ['neutral_ascii'],
    keywords: ['neutral', 'ascii', 'meh'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_confused',
    unicode_codepoint: 'ASCII',
    unicode_char: ':/',
    name: 'Confused ASCII',
    description: 'ASCII confused face',
    category: 'ascii',
    tags: ['confused', 'unsure', 'classic'],
    aliases: ['confused_ascii'],
    keywords: ['confused', 'ascii', 'unsure'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_kiss',
    unicode_codepoint: 'ASCII',
    unicode_char: ':*',
    name: 'Kiss ASCII',
    description: 'ASCII kissing face',
    category: 'ascii',
    tags: ['kiss', 'love', 'classic'],
    aliases: ['kiss_ascii'],
    keywords: ['kiss', 'ascii', 'love'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_heart',
    unicode_codepoint: 'ASCII',
    unicode_char: '<3',
    name: 'Heart ASCII',
    description: 'ASCII heart symbol',
    category: 'ascii',
    tags: ['heart', 'love', 'classic'],
    aliases: ['heart_ascii'],
    keywords: ['heart', 'ascii', 'love'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_broken_heart',
    unicode_codepoint: 'ASCII',
    unicode_char: '</3',
    name: 'Broken Heart ASCII',
    description: 'ASCII broken heart',
    category: 'ascii',
    tags: ['broken_heart', 'sad', 'classic'],
    aliases: ['broken_heart_ascii'],
    keywords: ['broken_heart', 'ascii', 'sad'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_thumbs_up',
    unicode_codepoint: 'ASCII',
    unicode_char: '(y)',
    name: 'Thumbs Up ASCII',
    description: 'ASCII thumbs up',
    category: 'ascii',
    tags: ['thumbs_up', 'approval', 'classic'],
    aliases: ['thumbs_up_ascii'],
    keywords: ['thumbs_up', 'ascii', 'approval'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_thumbs_down',
    unicode_codepoint: 'ASCII',
    unicode_char: '(n)',
    name: 'Thumbs Down ASCII',
    description: 'ASCII thumbs down',
    category: 'ascii',
    tags: ['thumbs_down', 'disapproval', 'classic'],
    aliases: ['thumbs_down_ascii'],
    keywords: ['thumbs_down', 'ascii', 'disapproval'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_shrug',
    unicode_codepoint: 'ASCII',
    unicode_char: '¯\\_(ツ)_/¯',
    name: 'Shrug ASCII',
    description: 'ASCII shrug emoticon',
    category: 'ascii',
    tags: ['shrug', 'dunno', 'classic'],
    aliases: ['shrug_ascii'],
    keywords: ['shrug', 'ascii', 'dunno'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_table_flip',
    unicode_codepoint: 'ASCII',
    unicode_char: '(╯°□°）╯︵ ┻━┻',
    name: 'Table Flip ASCII',
    description: 'ASCII table flip rage',
    category: 'ascii',
    tags: ['rage', 'angry', 'table_flip'],
    aliases: ['table_flip_ascii'],
    keywords: ['rage', 'ascii', 'angry'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_put_table_back',
    unicode_codepoint: 'ASCII',
    unicode_char: '┬─┬ ノ( ゜-゜ノ)',
    name: 'Put Table Back ASCII',
    description: 'ASCII putting table back',
    category: 'ascii',
    tags: ['calm', 'restore', 'table'],
    aliases: ['put_table_back_ascii'],
    keywords: ['calm', 'ascii', 'restore'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_bear_hug',
    unicode_codepoint: 'ASCII',
    unicode_char: 'ʕ•ᴥ•ʔ',
    name: 'Bear Hug ASCII',
    description: 'ASCII bear face',
    category: 'ascii',
    tags: ['bear', 'cute', 'hug'],
    aliases: ['bear_ascii'],
    keywords: ['bear', 'ascii', 'cute'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_lenny_face',
    unicode_codepoint: 'ASCII',
    unicode_char: '( ͡° ͜ʖ ͡°)',
    name: 'Lenny Face ASCII',
    description: 'ASCII Lenny face',
    category: 'ascii',
    tags: ['lenny', 'mischief', 'classic'],
    aliases: ['lenny_ascii'],
    keywords: ['lenny', 'ascii', 'mischief'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_disapproval',
    unicode_codepoint: 'ASCII',
    unicode_char: 'ಠ_ಠ',
    name: 'Look of Disapproval ASCII',
    description: 'ASCII look of disapproval',
    category: 'ascii',
    tags: ['disapproval', 'judgment', 'classic'],
    aliases: ['disapproval_ascii'],
    keywords: ['disapproval', 'ascii', 'judgment'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_double_rainbow',
    unicode_codepoint: 'ASCII',
    unicode_char: '☆*:.｡.o(≧▽≦)o.｡.:*☆',
    name: 'Sparkly Happy ASCII',
    description: 'ASCII sparkly happy face',
    category: 'ascii',
    tags: ['sparkly', 'excited', 'kawaii'],
    aliases: ['sparkly_ascii'],
    keywords: ['sparkly', 'ascii', 'excited'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'ascii_crying',
    unicode_codepoint: 'ASCII',
    unicode_char: '(╥﹏╥)',
    name: 'Crying ASCII',
    description: 'ASCII crying face',
    category: 'ascii',
    tags: ['crying', 'sad', 'tears'],
    aliases: ['crying_ascii'],
    keywords: ['crying', 'ascii', 'sad'],
    windows_version_min: '10'
  },

  // Technology & Devices
  {
    emoji_id: 'laptop',
    unicode_codepoint: 'U+1F4BB',
    unicode_char: '💻',
    name: 'Laptop',
    description: 'A laptop computer',
    category: 'objects',
    tags: ['computer', 'laptop', 'technology'],
    aliases: ['computer'],
    keywords: ['computer', 'laptop', 'technology'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'desktop_computer',
    unicode_codepoint: 'U+1F5A5',
    unicode_char: '🖥️',
    name: 'Desktop Computer',
    description: 'A desktop computer',
    category: 'objects',
    tags: ['computer', 'desktop', 'monitor'],
    aliases: ['desktop'],
    keywords: ['computer', 'desktop', 'monitor'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'mobile_phone',
    unicode_codepoint: 'U+1F4F1',
    unicode_char: '📱',
    name: 'Mobile Phone',
    description: 'A mobile phone',
    category: 'objects',
    tags: ['phone', 'mobile', 'smartphone'],
    aliases: ['iphone'],
    keywords: ['phone', 'mobile', 'smartphone'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'keyboard',
    unicode_codepoint: 'U+2328',
    unicode_char: '⌨️',
    name: 'Keyboard',
    description: 'A computer keyboard',
    category: 'objects',
    tags: ['keyboard', 'typing', 'computer'],
    aliases: ['keyboard'],
    keywords: ['keyboard', 'typing', 'computer'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'computer_mouse',
    unicode_codepoint: 'U+1F5B1',
    unicode_char: '🖱️',
    name: 'Computer Mouse',
    description: 'A computer mouse',
    category: 'objects',
    tags: ['mouse', 'computer', 'click'],
    aliases: ['mouse'],
    keywords: ['mouse', 'computer', 'click'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'joystick',
    unicode_codepoint: 'U+1F579',
    unicode_char: '🕹️',
    name: 'Joystick',
    description: 'A gaming joystick',
    category: 'objects',
    tags: ['gaming', 'joystick', 'controller'],
    aliases: ['joystick'],
    keywords: ['gaming', 'joystick', 'controller'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'video_game',
    unicode_codepoint: 'U+1F3AE',
    unicode_char: '🎮',
    name: 'Video Game',
    description: 'A video game controller',
    category: 'objects',
    tags: ['gaming', 'controller', 'video_game'],
    aliases: ['video_game'],
    keywords: ['gaming', 'controller', 'video_game'],
    windows_version_min: '10'
  },

  // Programming & Development
  {
    emoji_id: 'gear',
    unicode_codepoint: 'U+2699',
    unicode_char: '⚙️',
    name: 'Gear',
    description: 'A mechanical gear',
    category: 'objects',
    tags: ['gear', 'settings', 'mechanical'],
    aliases: ['gear'],
    keywords: ['gear', 'settings', 'mechanical'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'wrench',
    unicode_codepoint: 'U+1F527',
    unicode_char: '🔧',
    name: 'Wrench',
    description: 'A wrench tool',
    category: 'objects',
    tags: ['wrench', 'tool', 'fix'],
    aliases: ['wrench'],
    keywords: ['wrench', 'tool', 'fix'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'hammer_and_wrench',
    unicode_codepoint: 'U+1F6E0',
    unicode_char: '🛠️',
    name: 'Hammer and Wrench',
    description: 'Tools for building and fixing',
    category: 'objects',
    tags: ['tools', 'build', 'fix'],
    aliases: ['tools'],
    keywords: ['tools', 'build', 'fix'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'electric_plug',
    unicode_codepoint: 'U+1F50C',
    unicode_char: '🔌',
    name: 'Electric Plug',
    description: 'An electric plug',
    category: 'objects',
    tags: ['plug', 'electric', 'power'],
    aliases: ['electric_plug'],
    keywords: ['plug', 'electric', 'power'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'battery',
    unicode_codepoint: 'U+1F50B',
    unicode_char: '🔋',
    name: 'Battery',
    description: 'A battery',
    category: 'objects',
    tags: ['battery', 'power', 'energy'],
    aliases: ['battery'],
    keywords: ['battery', 'power', 'energy'],
    windows_version_min: '10'
  },

  // Weather & Nature
  {
    emoji_id: 'sun',
    unicode_codepoint: 'U+2600',
    unicode_char: '☀️',
    name: 'Sun',
    description: 'A bright sun',
    category: 'objects',
    tags: ['sun', 'sunny', 'bright'],
    aliases: ['sunny'],
    keywords: ['sun', 'sunny', 'bright'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'cloud',
    unicode_codepoint: 'U+2601',
    unicode_char: '☁️',
    name: 'Cloud',
    description: 'A fluffy cloud',
    category: 'objects',
    tags: ['cloud', 'cloudy', 'weather'],
    aliases: ['cloud'],
    keywords: ['cloud', 'cloudy', 'weather'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'umbrella_with_rain_drops',
    unicode_codepoint: 'U+2614',
    unicode_char: '☔',
    name: 'Umbrella with Rain Drops',
    description: 'An umbrella with rain',
    category: 'objects',
    tags: ['rain', 'umbrella', 'weather'],
    aliases: ['umbrella'],
    keywords: ['rain', 'umbrella', 'weather'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'snowman',
    unicode_codepoint: 'U+2603',
    unicode_char: '☃️',
    name: 'Snowman',
    description: 'A snowman',
    category: 'objects',
    tags: ['snowman', 'winter', 'cold'],
    aliases: ['snowman'],
    keywords: ['snowman', 'winter', 'cold'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'snowflake',
    unicode_codepoint: 'U+2744',
    unicode_char: '❄️',
    name: 'Snowflake',
    description: 'A snowflake',
    category: 'objects',
    tags: ['snowflake', 'winter', 'cold'],
    aliases: ['snowflake'],
    keywords: ['snowflake', 'winter', 'cold'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'comet',
    unicode_codepoint: 'U+2604',
    unicode_char: '☄️',
    name: 'Comet',
    description: 'A comet',
    category: 'objects',
    tags: ['comet', 'space', 'shooting_star'],
    aliases: ['comet'],
    keywords: ['comet', 'space', 'shooting_star'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'rainbow',
    unicode_codepoint: 'U+1F308',
    unicode_char: '🌈',
    name: 'Rainbow',
    description: 'A colorful rainbow',
    category: 'objects',
    tags: ['rainbow', 'colors', 'pride'],
    aliases: ['rainbow'],
    keywords: ['rainbow', 'colors', 'pride'],
    windows_version_min: '10'
  },

  // More Animals
  {
    emoji_id: 'monkey_face',
    unicode_codepoint: 'U+1F435',
    unicode_char: '🐵',
    name: 'Monkey Face',
    description: 'A monkey face',
    category: 'animals',
    tags: ['monkey', 'primate', 'animal'],
    aliases: ['monkey_face'],
    keywords: ['monkey', 'primate', 'animal'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'see_no_evil_monkey',
    unicode_codepoint: 'U+1F648',
    unicode_char: '🙈',
    name: 'See-No-Evil Monkey',
    description: 'Monkey covering eyes',
    category: 'animals',
    tags: ['monkey', 'see_no_evil', 'embarrassed'],
    aliases: ['see_no_evil'],
    keywords: ['monkey', 'see_no_evil', 'embarrassed'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'hear_no_evil_monkey',
    unicode_codepoint: 'U+1F649',
    unicode_char: '🙉',
    name: 'Hear-No-Evil Monkey',
    description: 'Monkey covering ears',
    category: 'animals',
    tags: ['monkey', 'hear_no_evil', 'deaf'],
    aliases: ['hear_no_evil'],
    keywords: ['monkey', 'hear_no_evil', 'deaf'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'speak_no_evil_monkey',
    unicode_codepoint: 'U+1F64A',
    unicode_char: '🙊',
    name: 'Speak-No-Evil Monkey',
    description: 'Monkey covering mouth',
    category: 'animals',
    tags: ['monkey', 'speak_no_evil', 'quiet'],
    aliases: ['speak_no_evil'],
    keywords: ['monkey', 'speak_no_evil', 'quiet'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'elephant',
    unicode_codepoint: 'U+1F418',
    unicode_char: '🐘',
    name: 'Elephant',
    description: 'A large elephant',
    category: 'animals',
    tags: ['elephant', 'large', 'memory'],
    aliases: ['elephant'],
    keywords: ['elephant', 'large', 'memory'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'penguin',
    unicode_codepoint: 'U+1F427',
    unicode_char: '🐧',
    name: 'Penguin',
    description: 'A cute penguin',
    category: 'animals',
    tags: ['penguin', 'bird', 'cold'],
    aliases: ['penguin'],
    keywords: ['penguin', 'bird', 'cold'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'turtle',
    unicode_codepoint: 'U+1F422',
    unicode_char: '🐢',
    name: 'Turtle',
    description: 'A slow turtle',
    category: 'animals',
    tags: ['turtle', 'slow', 'shell'],
    aliases: ['turtle'],
    keywords: ['turtle', 'slow', 'shell'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'snake',
    unicode_codepoint: 'U+1F40D',
    unicode_char: '🐍',
    name: 'Snake',
    description: 'A slithering snake',
    category: 'animals',
    tags: ['snake', 'python', 'slither'],
    aliases: ['snake'],
    keywords: ['snake', 'python', 'slither'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'dragon',
    unicode_codepoint: 'U+1F409',
    unicode_char: '🐉',
    name: 'Dragon',
    description: 'A mythical dragon',
    category: 'animals',
    tags: ['dragon', 'mythical', 'fire'],
    aliases: ['dragon'],
    keywords: ['dragon', 'mythical', 'fire'],
    windows_version_min: '10'
  },
  {
    emoji_id: 'sauropod',
    unicode_codepoint: 'U+1F995',
    unicode_char: '🦕',
    name: 'Sauropod',
    description: 'A long-necked dinosaur',
    category: 'animals',
    tags: ['dinosaur', 'sauropod', 'extinct'],
    aliases: ['sauropod'],
    keywords: ['dinosaur', 'sauropod', 'extinct'],
    windows_version_min: '10'
  },
  {
    emoji_id: 't_rex',
    unicode_codepoint: 'U+1F996',
    unicode_char: '🦖',
    name: 'T-Rex',
    description: 'A fierce T-Rex',
    category: 'animals',
    tags: ['dinosaur', 't_rex', 'extinct'],
    aliases: ['t_rex'],
    keywords: ['dinosaur', 't_rex', 'extinct'],
    windows_version_min: '10'
  }
];

// Comprehensive emoji data for Mac (similar to Windows but with different version requirements)
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
