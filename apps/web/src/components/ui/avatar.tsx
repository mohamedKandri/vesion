import { cn, initials } from '@/lib/utils';

export function Avatar({
  firstName,
  lastName,
  src,
  size = 'md',
  className,
}: {
  firstName?: string;
  lastName?: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-14 w-14 text-lg' };
  const name = `${firstName ?? ''} ${lastName ?? ''}`.trim();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('shrink-0 rounded-full object-cover', sizes[size], className)}
      />
    );
  }
  return (
    <span
      aria-label={name || 'Avatar'}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-brand-gradient font-bold text-white',
        sizes[size],
        className,
      )}
    >
      {initials(firstName, lastName)}
    </span>
  );
}
