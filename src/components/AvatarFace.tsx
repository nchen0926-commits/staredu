/**
 * Default profile picture for a 家長回饋 entry that has no uploaded photo.
 * Styled like the pictures people typically use as LINE avatars (pets, flowers,
 * scenery, coffee, plants) instead of a cartoon person. The picture is picked
 * from the entry's position so a column of feedback doesn't repeat itself.
 * Upload a real avatar in the admin to replace it.
 */
const COUNT = 6;

function Cat() {
  return (
    <>
      <rect width="100" height="100" fill="#CFE8FB" />
      <ellipse cx="50" cy="102" rx="26" ry="20" fill="#F2A65A" />
      <path d="M25 40 L29 13 L47 28 Z" fill="#F2A65A" />
      <path d="M75 40 L71 13 L53 28 Z" fill="#F2A65A" />
      <path d="M31 32 L32 20 L41 27 Z" fill="#F7C6C0" />
      <path d="M69 32 L68 20 L59 27 Z" fill="#F7C6C0" />
      <ellipse cx="50" cy="53" rx="27" ry="24" fill="#F2A65A" />
      <g stroke="#D9822B" strokeWidth="2.4" strokeLinecap="round">
        <path d="M50 31 L50 39" />
        <path d="M41.5 33 L43 39" />
        <path d="M58.5 33 L57 39" />
      </g>
      <ellipse cx="50" cy="62" rx="12" ry="8.5" fill="#FFF3E3" />
      <ellipse cx="39.5" cy="51" rx="3" ry="3.8" fill="#2B2B2B" />
      <ellipse cx="60.5" cy="51" rx="3" ry="3.8" fill="#2B2B2B" />
      <circle cx="40.5" cy="49.6" r="1.1" fill="#fff" />
      <circle cx="61.5" cy="49.6" r="1.1" fill="#fff" />
      <path d="M47.3 57 h5.4 l-2.7 3.2 z" fill="#E88B8B" />
      <path d="M50 60 Q46.5 65 42.5 62.5 M50 60 Q53.5 65 57.5 62.5" fill="none" stroke="#6B4A3A" strokeWidth="1.6" strokeLinecap="round" />
      <g stroke="#8A6A55" strokeWidth="1.2" strokeLinecap="round">
        <path d="M30 58 L18 55" />
        <path d="M30 62 L18 63" />
        <path d="M70 58 L82 55" />
        <path d="M70 62 L82 63" />
      </g>
    </>
  );
}

function Dog() {
  return (
    <>
      <rect width="100" height="100" fill="#FDE7A8" />
      <ellipse cx="50" cy="102" rx="28" ry="20" fill="#E39B55" />
      <path d="M50 80 Q50 86 50 86" stroke="#C0392B" strokeWidth="1" fill="none" />
      <path d="M32 84 Q50 94 68 84 L68 90 Q50 100 32 90 Z" fill="#D9534F" />
      <path d="M24 46 L26 15 L45 30 Z" fill="#D98E4A" />
      <path d="M76 46 L74 15 L55 30 Z" fill="#D98E4A" />
      <path d="M30 38 L31 24 L40 31 Z" fill="#F5C9A0" />
      <path d="M70 38 L69 24 L60 31 Z" fill="#F5C9A0" />
      <ellipse cx="50" cy="54" rx="28" ry="24" fill="#E39B55" />
      <ellipse cx="50" cy="63" rx="21" ry="14.5" fill="#FFF4E4" />
      <circle cx="40" cy="41.5" r="2.4" fill="#FFF4E4" />
      <circle cx="60" cy="41.5" r="2.4" fill="#FFF4E4" />
      <circle cx="40.5" cy="50" r="2.8" fill="#2B2B2B" />
      <circle cx="59.5" cy="50" r="2.8" fill="#2B2B2B" />
      <circle cx="41.4" cy="49" r="0.9" fill="#fff" />
      <circle cx="60.4" cy="49" r="0.9" fill="#fff" />
      <ellipse cx="50" cy="58.5" rx="4.4" ry="3.2" fill="#2B2B2B" />
      <path d="M50 61.5 L50 65 M50 65 Q45 70 40.5 65.5 M50 65 Q55 70 59.5 65.5" fill="none" stroke="#6B4A3A" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M46.5 67 Q50 76 53.5 67 Z" fill="#F28B8B" />
    </>
  );
}

function Daisy() {
  return (
    <>
      <rect width="100" height="100" fill="#D5EEC8" />
      <circle cx="18" cy="82" r="14" fill="#C3E5B3" />
      <circle cx="86" cy="22" r="10" fill="#E2F4D6" />
      <path d="M50 52 Q54 76 49 104" fill="none" stroke="#4E9A5A" strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="62" cy="80" rx="12" ry="5.5" transform="rotate(-28 62 80)" fill="#5DAE68" />
      <ellipse cx="38" cy="88" rx="11" ry="5" transform="rotate(25 38 88)" fill="#4E9A5A" />
      <g fill="#FFFFFF" stroke="#E7EFE0" strokeWidth="0.8">
        {Array.from({ length: 10 }, (_, i) => (
          <ellipse key={i} cx="50" cy="26" rx="6" ry="13.5" transform={`rotate(${i * 36} 50 42)`} />
        ))}
      </g>
      <circle cx="50" cy="42" r="10" fill="#F5B73B" />
      <circle cx="47" cy="39.5" r="2.4" fill="#FAD36E" />
    </>
  );
}

function Sunset() {
  return (
    <>
      <defs>
        <linearGradient id="avatar-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7A6FC4" />
          <stop offset="0.5" stopColor="#F28FA6" />
          <stop offset="1" stopColor="#FFC27A" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#avatar-sky)" />
      <circle cx="50" cy="60" r="15" fill="#FFE59A" />
      <path d="M0 68 L20 46 L36 62 L58 42 L100 70 L100 74 L0 74 Z" fill="#7B5C9E" />
      <path d="M0 74 L100 74 L100 100 L0 100 Z" fill="#4F6FA8" />
      <g fill="#FFE59A" opacity="0.8">
        <rect x="40" y="78" width="20" height="2.4" rx="1.2" />
        <rect x="43" y="84" width="14" height="2.4" rx="1.2" />
        <rect x="46" y="90" width="8" height="2.4" rx="1.2" />
      </g>
      <g fill="#fff" opacity="0.85">
        <ellipse cx="22" cy="22" rx="11" ry="3.6" />
        <ellipse cx="74" cy="30" rx="13" ry="3.8" />
      </g>
    </>
  );
}

function Coffee() {
  return (
    <>
      <rect width="100" height="100" fill="#E8D5BF" />
      <circle cx="50" cy="52" r="42" fill="#F7F0E8" />
      <path d="M86 44 Q99 44 99 54 Q99 64 86 64" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="52" r="31" fill="#FFFFFF" stroke="#EADFD2" strokeWidth="2" />
      <circle cx="50" cy="52" r="25.5" fill="#8B5A3C" />
      <circle cx="50" cy="52" r="22" fill="#A5704B" />
      <path d="M50 66 C34 55 37 40 45.5 40 C48.5 40 50 42.5 50 44 C50 42.5 51.5 40 54.5 40 C63 40 66 55 50 66 Z" fill="#F6E7D3" />
      <path d="M50 60 C42 54 43 46 47 46" fill="none" stroke="#C99A72" strokeWidth="1.4" strokeLinecap="round" />
    </>
  );
}

function Plant() {
  return (
    <>
      <rect width="100" height="100" fill="#F9D3E1" />
      <circle cx="80" cy="24" r="12" fill="#FBE3EC" />
      <g transform="translate(0 0)">
        <ellipse cx="50" cy="44" rx="7.5" ry="21" fill="#3E9B5F" />
        <ellipse cx="50" cy="44" rx="7.5" ry="21" transform="rotate(-38 50 68)" fill="#4DB070" />
        <ellipse cx="50" cy="44" rx="7.5" ry="21" transform="rotate(38 50 68)" fill="#4DB070" />
        <ellipse cx="50" cy="48" rx="6" ry="16" transform="rotate(-68 50 68)" fill="#7CC98C" />
        <ellipse cx="50" cy="48" rx="6" ry="16" transform="rotate(68 50 68)" fill="#7CC98C" />
        <path d="M50 66 L50 30" stroke="#2F7D4A" strokeWidth="1.2" />
      </g>
      <rect x="31" y="66" width="38" height="8" rx="3" fill="#E89B73" />
      <path d="M35 74 L65 74 L61 96 Q60 99 57 99 L43 99 Q40 99 39 96 Z" fill="#D9825B" />
      <path d="M38 82 L62 82" stroke="#C26F49" strokeWidth="1.6" strokeLinecap="round" />
    </>
  );
}

const PICTURES = [Cat, Dog, Daisy, Sunset, Coffee, Plant];

export default function AvatarFace({ index = 0, className = '' }: { index?: number; className?: string }) {
  const n = Math.abs(index) % COUNT;
  const Picture = PICTURES[n];
  const clipId = `avatar-clip-${n}`;
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="預設頭像" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <Picture />
      </g>
    </svg>
  );
}
