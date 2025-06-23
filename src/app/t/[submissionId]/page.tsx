import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  cleanContentForSocialSharing,
  extractEmbedUrls,
  getFirstYouTubeUrl
} from '../../../lib/utils/social-sharing';
import { Submission } from '../../components/submission-forms/schema';
import { getSubmissionThread } from '../../components/thread/actions';
import ThreadPageClient from './ThreadPageClient';

interface ThreadPageProps {
  params: {
    submissionId: string;
  };
}

interface ThreadData {
  parent: Submission | null;
  replies: Submission[];
}

// Generate metadata for the thread page including initial post content
export async function generateMetadata({
  params
}: ThreadPageProps): Promise<Metadata> {
  const submissionId = parseInt(params.submissionId);

  if (isNaN(submissionId)) {
    return {
      title: 'Thread Not Found',
      description: 'The requested thread could not be found.'
    };
  }

  try {
    const threadData = await getSubmissionThread(submissionId);

    if (!threadData.parent) {
      return {
        title: 'Thread Not Found',
        description: 'The requested thread could not be found.'
      };
    }

    const parent = threadData.parent;
    const title = parent.submission_title || parent.submission_name;
    const content = parent.submission_name;
    const author = parent.author || 'Anonymous';
    const replyCount = threadData.replies.length;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://idling.app';

    // Clean title and content for social media sharing
    const cleanTitle = cleanContentForSocialSharing(title, {
      convertEmbedsToUrls: true,
      maxLength: 100 // Shorter for titles
    });

    const cleanContent = cleanContentForSocialSharing(content, {
      convertEmbedsToUrls: true,
      maxLength: 150 // Optimal for social sharing descriptions
    });

    // Check for YouTube URLs and other embeds in the title for enhanced social sharing
    const youtubeUrl = getFirstYouTubeUrl(title);
    const embedUrls = extractEmbedUrls(title);

    // Enhanced metadata with thread-specific information
    const metaTitle =
      replyCount > 0
        ? `${cleanTitle} (${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}) - Thread Discussion | Idling.app`
        : `${cleanTitle} - Thread Discussion | Idling.app`;

    // Base Open Graph metadata
    const openGraphMetadata: any = {
      title: cleanTitle,
      description: cleanContent,
      type: 'article',
      authors: [author],
      publishedTime: parent.submission_datetime.toISOString(),
      tags: parent.tags,
      siteName: 'Idling.app',
      url: `${baseUrl}/t/${submissionId}`
    };

    // Base Twitter Card metadata
    const twitterMetadata: any = {
      card: 'summary_large_image',
      title: cleanTitle,
      description: cleanContent,
      creator: `@${author}`,
      site: '@idlingapp' // Update with your actual Twitter handle
    };

    // Enhanced metadata for YouTube embeds in thread title
    if (youtubeUrl) {
      const videoId = extractYouTubeVideoId(youtubeUrl);

      if (videoId) {
        // Use video player card for Twitter
        twitterMetadata.card = 'player';
        twitterMetadata.player = `https://www.youtube.com/embed/${videoId}`;
        twitterMetadata.playerWidth = 560;
        twitterMetadata.playerHeight = 315;

        // Add video-specific Open Graph metadata
        openGraphMetadata.type = 'video.other';
        openGraphMetadata.video = `https://www.youtube.com/embed/${videoId}`;
        openGraphMetadata.videoSecureUrl = `https://www.youtube.com/embed/${videoId}`;
        openGraphMetadata.videoType = 'text/html';
        openGraphMetadata.videoWidth = 560;
        openGraphMetadata.videoHeight = 315;

        // Add YouTube thumbnail as image
        openGraphMetadata.images = [
          {
            url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            width: 1280,
            height: 720,
            alt: `YouTube video: ${cleanTitle}`
          }
        ];

        twitterMetadata.image = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    } else if (embedUrls.length > 0) {
      // If there are other embed URLs (images, etc.), use the first one as the preview image
      const firstUrl = embedUrls[0];
      if (isImageUrl(firstUrl)) {
        openGraphMetadata.images = [
          {
            url: firstUrl,
            alt: `Image from thread: ${cleanTitle}`
          }
        ];
        twitterMetadata.card = 'summary_large_image';
        twitterMetadata.image = firstUrl;
      }
    }

    // Generate JSON-LD structured data
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      headline: cleanTitle,
      text: cleanContent,
      author: {
        '@type': 'Person',
        name: author
      },
      datePublished: parent.submission_datetime.toISOString(),
      url: `${baseUrl}/t/${submissionId}`,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ReplyAction',
        userInteractionCount: replyCount
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}/t/${submissionId}`
      },
      publisher: {
        '@type': 'Organization',
        name: 'Idling.app',
        url: baseUrl
      },
      ...(parent.tags.length > 0 && {
        keywords: parent.tags.join(', ')
      }),
      // Add video metadata to structured data if YouTube video is present
      ...(youtubeUrl && {
        video: {
          '@type': 'VideoObject',
          name: cleanTitle,
          description: cleanContent,
          embedUrl: `https://www.youtube.com/embed/${extractYouTubeVideoId(youtubeUrl)}`,
          thumbnailUrl: `https://img.youtube.com/vi/${extractYouTubeVideoId(youtubeUrl)}/maxresdefault.jpg`,
          uploadDate: parent.submission_datetime.toISOString()
        }
      })
    };

    return {
      title: metaTitle,
      description: cleanContent,
      keywords: [
        'thread',
        'discussion',
        'community',
        'forum',
        ...parent.tags,
        author
      ]
        .filter(Boolean)
        .join(', '),
      authors: [{ name: author }],
      openGraph: openGraphMetadata,
      twitter: twitterMetadata,
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1
        }
      },
      other: {
        'application-ld+json': JSON.stringify(jsonLd)
      }
    };
  } catch (error) {
    console.error('Error generating thread metadata:', error);
    return {
      title: 'Thread - Idling.app',
      description: 'Join the discussion on Idling.app'
    };
  }
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Check if URL is likely an image
 */
function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif|tiff|tif)(\?.*)?$/i.test(
    url
  );
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const submissionId = parseInt(params.submissionId);

  if (isNaN(submissionId)) {
    notFound();
  }

  // Pre-fetch thread data for SSR
  let initialThreadData: ThreadData | null = null;
  try {
    initialThreadData = await getSubmissionThread(submissionId);
    if (!initialThreadData.parent) {
      notFound();
    }
  } catch (error) {
    console.error('Error loading thread data:', error);
    notFound();
  }

  return (
    <ThreadPageClient
      submissionId={submissionId}
      initialThreadData={initialThreadData}
    />
  );
}
