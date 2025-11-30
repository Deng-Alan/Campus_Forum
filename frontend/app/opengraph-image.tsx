import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/seo'

export const runtime = 'edge'
export const alt = siteConfig.name
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(to bottom, #000000, #1a1a1a)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 120 }}>🎓</div>
        </div>
        <div style={{ fontSize: 72, fontWeight: 'bold', marginBottom: 20 }}>
          {siteConfig.name}
        </div>
        <div style={{ fontSize: 36, color: '#888' }}>
          校园趣事 · 学习互助 · 表白墙 · 匿名树洞
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
