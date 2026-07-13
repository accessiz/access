import { ImageResponse } from 'next/og';
import { getProjectById } from '@/lib/api/projects';

export const runtime = 'edge';

export const alt = 'Portal de Modelos';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ public_id: string }> }) {
  const { public_id } = await params;
  const project = await getProjectById(public_id);
  const brandName = project?.brand?.name || project?.client_name || project?.project_name || 'Casting';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #090514 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '2px', color: '#a855f7' }}>
            IZ MANAGEMENT
          </span>
          <span style={{ fontSize: '32px', fontWeight: '300', marginLeft: '10px', color: '#d8b4fe' }}>
            | ACCESS
          </span>
        </div>

        {/* Brand Name / Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <span style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '4px', color: '#c084fc' }}>
            Casting Disponibilidad
          </span>
          <span
            style={{
              fontSize: '84px',
              fontWeight: '900',
              lineHeight: '1.1',
              color: '#ffffff',
            }}
          >
            {brandName}
          </span>
        </div>

        {/* Footer / Call to action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(216, 180, 254, 0.1)', paddingTop: '30px' }}>
          <span style={{ fontSize: '20px', color: '#a78bfa' }}>
            Confirma tu disponibilidad en el portal
          </span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            access.izmgmt.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
