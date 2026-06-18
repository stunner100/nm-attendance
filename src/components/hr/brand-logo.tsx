type BrandLogoProps = {
  className?: string;
};

/** Fixed dimensions avoid layout shift; suppressHydrationWarning avoids dev-only img attribute drift. */
export function BrandLogo({ className }: BrandLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.jpg"
      alt=""
      width={32}
      height={32}
      decoding="async"
      suppressHydrationWarning
      className={className}
    />
  );
}
