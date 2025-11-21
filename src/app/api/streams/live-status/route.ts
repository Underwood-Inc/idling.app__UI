import { NextResponse } from 'next/server';

export interface StreamLiveStatusResponse {
  twitch: {
    isLive: boolean;
    title?: string;
    viewers?: number;
  };
  youtube: {
    isLive: boolean;
    title?: string;
    viewers?: number;
  };
}

/**
 * API endpoint to check live stream status for both Twitch and YouTube
 * Returns aggregated live status without requiring frontend API keys
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const twitchChannel = searchParams.get('twitch') || 'strixun';
    const youtubeChannel = searchParams.get('youtube') || '@strixun';

    const response: StreamLiveStatusResponse = {
      twitch: { isLive: false },
      youtube: { isLive: false }
    };

    // Check Twitch (requires Twitch API credentials)
    if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
      try {
        // Get Twitch OAuth token
        const tokenResponse = await fetch(
          'https://id.twitch.tv/oauth2/token',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.TWITCH_CLIENT_ID,
              client_secret: process.env.TWITCH_CLIENT_SECRET,
              grant_type: 'client_credentials'
            })
          }
        );

        if (tokenResponse.ok) {
          const { access_token } = await tokenResponse.json();

          // Check if channel is live
          const streamResponse = await fetch(
            `https://api.twitch.tv/helix/streams?user_login=${twitchChannel}`,
            {
              headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                Authorization: `Bearer ${access_token}`
              }
            }
          );

          if (streamResponse.ok) {
            const streamData = await streamResponse.json();
            if (streamData.data && streamData.data.length > 0) {
              const stream = streamData.data[0];
              response.twitch = {
                isLive: true,
                title: stream.title,
                viewers: stream.viewer_count
              };
            }
          }
        }
      } catch (twitchError) {
        console.error('Error checking Twitch status:', twitchError);
      }
    }

    // Check YouTube (requires YouTube Data API key)
    if (process.env.YOUTUBE_API_KEY) {
      try {
        // Extract channel handle/ID
        const channelHandle = youtubeChannel.replace('@', '');

        // First, get channel ID from handle
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${channelHandle}&type=channel&key=${process.env.YOUTUBE_API_KEY}`
        );

        if (channelResponse.ok) {
          const channelData = await channelResponse.json();
          if (channelData.items && channelData.items.length > 0) {
            const channelId = channelData.items[0].snippet.channelId;

            // Check for live streams
            const liveResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${process.env.YOUTUBE_API_KEY}`
            );

            if (liveResponse.ok) {
              const liveData = await liveResponse.json();
              if (liveData.items && liveData.items.length > 0) {
                const liveStream = liveData.items[0];
                response.youtube = {
                  isLive: true,
                  title: liveStream.snippet.title
                };
              }
            }
          }
        }
      } catch (youtubeError) {
        console.error('Error checking YouTube status:', youtubeError);
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking stream status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check stream status',
        twitch: { isLive: false },
        youtube: { isLive: false }
      },
      { status: 500 }
    );
  }
}

