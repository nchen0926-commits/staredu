const COLORS = ['#F4A261', '#7DB9E8', '#8FCB9B', '#E98FAE', '#A99BE0', '#F2C14E', '#6FC1B5', '#E8836B'];

/** Default avatar: the first character of the parent's name on a soft colour (the colour follows the character, so it never changes). */
export default function InitialAvatar({ name, className = '' }: { name: string; className?: string }) {
  const first = Array.from(name.trim())[0] ?? '家';
  const code = first.codePointAt(0) ?? 0;
  return (
    <div
      className={`${className} flex items-center justify-center text-white font-black select-none`}
      style={{ backgroundColor: COLORS[code % COLORS.length], fontSize: '3.25rem', lineHeight: 1 }}
      role="img"
      aria-label={name || '家長'}
    >
      {first.toUpperCase()}
    </div>
  );
}
