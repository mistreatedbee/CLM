import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Christian Leadership Movement'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const logoUrl = 'https://clm-snowy.vercel.app/images/logo.jpeg'

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0c1a63 0%, #1a2d8f 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        <img
          src={logoUrl}
          width={180}
          height={180}
          style={{ borderRadius: 24, objectFit: 'cover', border: '4px solid rgba(255,255,255,0.2)' }}
        />
        <div
          style={{
            marginTop: 36,
            fontSize: 52,
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.15,
          }}
        >
          Christian Leadership Movement
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 26,
            color: 'rgba(255,255,255,0.70)',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          Transforming Leaders, Transforming the Nations
        </div>
        <div
          style={{
            marginTop: 40,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 40,
            padding: '12px 32px',
            fontSize: 20,
            color: 'rgba(255,255,255,0.90)',
            fontWeight: 600,
          }}
        >
          clm-snowy.vercel.app
        </div>
      </div>
    ),
    { ...size },
  )
}
