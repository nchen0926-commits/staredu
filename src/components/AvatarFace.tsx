/**
 * Friendly cartoon head used when a 家長回饋 entry has no uploaded photo.
 * Several looks (hair, skin, background, shirt) so a row of feedback doesn't show
 * the same face repeatedly; the look is picked from the entry's position.
 */
interface Look {
  bg: string;
  skin: string;
  hair: string;
  shirt: string;
  hairStyle: 'short' | 'long' | 'bun' | 'curly' | 'bald';
}

const LOOKS: Look[] = [
  { bg: '#FDE7A8', skin: '#F6CFA8', hair: '#4A3426', shirt: '#F28C82', hairStyle: 'long' },
  { bg: '#CFE8FB', skin: '#E9BE95', hair: '#2E2A2A', shirt: '#4F8FD6', hairStyle: 'short' },
  { bg: '#F9D3E1', skin: '#F8D9BD', hair: '#7A4B2A', shirt: '#8E7CC3', hairStyle: 'bun' },
  { bg: '#D5EEC8', skin: '#D9A87C', hair: '#1F1B1B', shirt: '#F5B84A', hairStyle: 'curly' },
  { bg: '#E3DDF8', skin: '#F2C9A0', hair: '#B5651D', shirt: '#59B38E', hairStyle: 'long' },
  { bg: '#FFD9C2', skin: '#EBC19A', hair: '#3A2C25', shirt: '#E36F6F', hairStyle: 'short' },
];

export default function AvatarFace({ index = 0, className = '' }: { index?: number; className?: string }) {
  const look = LOOKS[Math.abs(index) % LOOKS.length];
  const clipId = `avatar-clip-${Math.abs(index) % LOOKS.length}`;
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="家長頭像" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="100" height="100" fill={look.bg} />
        {/* long hair sits behind the head and shoulders */}
        {look.hairStyle === 'long' && <path d="M24 50 C22 22 78 22 76 50 L78 84 L22 84 Z" fill={look.hair} />}
        {/* shoulders + neck */}
        <ellipse cx="50" cy="104" rx="38" ry="27" fill={look.shirt} />
        <rect x="43.5" y="60" width="13" height="16" rx="5" fill={look.skin} />
        {/* bun / curly hair behind the head */}
        {look.hairStyle === 'bun' && <circle cx="50" cy="21" r="10" fill={look.hair} />}
        {look.hairStyle === 'curly' && (
          <g fill={look.hair}>
            <circle cx="33" cy="34" r="10" />
            <circle cx="45" cy="26" r="11" />
            <circle cx="58" cy="26" r="11" />
            <circle cx="68" cy="35" r="10" />
          </g>
        )}
        {/* head */}
        <ellipse cx="50" cy="46" rx="19" ry="21" fill={look.skin} />
        {/* fringe */}
        {look.hairStyle !== 'bald' && look.hairStyle !== 'curly' && (
          <path d="M30 46 C27 22 73 22 70 46 C65 38 57 33 50 33 C43 33 35 38 30 46 Z" fill={look.hair} />
        )}
        {look.hairStyle === 'curly' && <path d="M32 42 C36 34 64 34 68 42 C60 38 40 38 32 42 Z" fill={look.hair} />}
        {/* face */}
        <circle cx="42.5" cy="48" r="2.3" fill="#3B2F2F" />
        <circle cx="57.5" cy="48" r="2.3" fill="#3B2F2F" />
        <circle cx="37" cy="55" r="3.6" fill="#F29C94" opacity="0.55" />
        <circle cx="63" cy="55" r="3.6" fill="#F29C94" opacity="0.55" />
        <path d="M44 56.5 Q50 62.5 56 56.5" fill="none" stroke="#7A3E36" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
