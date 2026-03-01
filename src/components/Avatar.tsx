const BG_COLORS = [
  'bg-blue-200',
  'bg-pink-200',
  'bg-teal-200',
  'bg-orange-100',
  'bg-purple-200'
];

export function getAvatarBgColor(uid?: string) {
  if (!uid) return 'bg-slate-200';
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % BG_COLORS.length;
  return BG_COLORS[index];
}

interface AvatarProps {
  url?: string | null;
  uid?: string;
  sizeClassName?: string;
  alt?: string;
  className?: string;
}

export default function Avatar({ url, uid, sizeClassName = 'w-16 h-16', alt = 'Avatar', className = '' }: AvatarProps) {
  const bgClass = getAvatarBgColor(uid);

  return (
    <div className={`relative flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center ${bgClass} ${sizeClassName} ${className}`}>
      {url ? (
        <img
          src={url}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-xl opacity-50 font-bold">
          {alt.charAt(0)?.toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
}
