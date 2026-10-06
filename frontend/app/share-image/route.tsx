import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', padding: '64px', background: '#f7f6f2', color: '#111111', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 28 }}><div style={{ display: 'flex', width: 28, height: 28, background: '#b91c1c' }} />Redwell Studio</div>
      <div style={{ display: 'flex', fontSize: 100, lineHeight: 1, letterSpacing: '-5px', fontWeight: 700, flexDirection: 'column' }}><span>Make your</span><span>photos matter.</span></div>
      <div style={{ display: 'flex', fontSize: 25, color: '#66635f' }}>Photo collages. Thoughtful layouts. Your browser.</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
