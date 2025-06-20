import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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

    // Truncate content for description (150 chars max for optimal social sharing)
    const description =
      content.length > 150 ? content.substring(0, 147) + '...' : content;

    // Enhanced metadata with thread-specific information
    const metaTitle =
      replyCount > 0
        ? `${title} (${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}) - Thread Discussion | Idling.app`
        : `${title} - Thread Discussion | Idling.app`;

    // Generate JSON-LD structured data
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      headline: title,
      text: content,
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
      })
    };

    return {
      title: metaTitle,
      description: description,
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
      openGraph: {
        title: title,
        description: description,
        type: 'article',
        authors: [author],
        publishedTime: parent.submission_datetime.toISOString(),
        tags: parent.tags,
        siteName: 'Idling.app',
        url: `${baseUrl}/t/${submissionId}`
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        creator: `@${author}`
      },
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
