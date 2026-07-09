import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/** Generated favicon: the Vesion "V" on the brand gradient. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #a855f7 100%)',
          borderRadius: 8,
          color: 'white',
          fontSize: 20,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        V
      </div>
    ),
    size,
  );
}
