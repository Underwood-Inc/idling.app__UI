import { AspectRatioOption } from '../types/generation';

export interface AspectRatioConfig extends AspectRatioOption {
  width: number;
  height: number;
}

export const ASPECT_RATIO_OPTIONS: AspectRatioConfig[] = [
  {
    key: 'default',
    name: 'Open Graph',
    description: 'Standard social media sharing',
    dimensions: '1200×630',
    width: 1200,
    height: 630
  },
  {
    key: 'square',
    name: 'Square (1:1)',
    description: 'Instagram posts, Facebook posts',
    dimensions: '1080×1080',
    width: 1080,
    height: 1080
  },
  {
    key: '4-3',
    name: 'Standard (4:3)',
    description: 'Presentations, classic displays',
    dimensions: '1200×900',
    width: 1200,
    height: 900
  },
  {
    key: 'youtube',
    name: 'YouTube Thumbnail',
    description: 'YouTube thumbnails, video content',
    dimensions: '1280×720',
    width: 1280,
    height: 720
  },
  {
    key: 'facebook-cover',
    name: 'Facebook Cover',
    description: 'Facebook cover photos',
    dimensions: '1200×630',
    width: 1200,
    height: 630
  },
  {
    key: 'linkedin-banner',
    name: 'LinkedIn Banner',
    description: 'LinkedIn profile banners',
    dimensions: '1584×396',
    width: 1584,
    height: 396
  },
  {
    key: 'twitter-header',
    name: 'Twitter Header',
    description: 'Twitter profile headers',
    dimensions: '1500×500',
    width: 1500,
    height: 500
  }
]; 