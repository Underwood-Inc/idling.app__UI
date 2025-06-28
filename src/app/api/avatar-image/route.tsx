import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seed = searchParams.get('seed') || 'default-seed';

    // Generate consistent colors based on seed (same logic as Avatar component)
    const colors = [
      '#ff6b35',
      '#f7931e',
      '#ffd23f',
      '#06d6a0',
      '#118ab2',
      '#073b4c'
    ];
    const skinColors = [
      '#fdbcb4',
      '#eea990',
      '#f2d7d5',
      '#ddb7a0',
      '#c09b7a',
      '#a67c52'
    ];

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash = hash & hash;
    }

    const bgColor = colors[Math.abs(hash) % colors.length];
    const faceColor = skinColors[Math.abs(hash >> 3) % skinColors.length];
    const hairColor = colors[Math.abs(hash >> 6) % colors.length];

    // Create a simple avatar using basic shapes (compatible with Next.js OG)
    return new ImageResponse(
      (
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              backgroundColor: faceColor,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#000'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#000'
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '15px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '10px',
                borderRadius: '0 0 10px 10px',
                backgroundColor: '#000'
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '30px',
              borderRadius: '40px 40px 0 0',
              backgroundColor: hairColor
            }}
          />
        </div>
      ),
      {
        width: 120,
        height: 120
      }
    );
  } catch (error) {
    console.error('Failed to generate avatar image:', error);

    // Fallback simple colored circle
    const seed = new URL(request.url).searchParams.get('seed') || 'default';
    const colors = [
      '#ff6b35',
      '#f7931e',
      '#ffd23f',
      '#06d6a0',
      '#118ab2',
      '#073b4c'
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash = hash & hash;
    }
    const bgColor = colors[Math.abs(hash) % colors.length];

    return new ImageResponse(
      (
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      ),
      {
        width: 120,
        height: 120
      }
    );
  }
}
