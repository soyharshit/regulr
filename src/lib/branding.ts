export function getBrandStyles(brandColor: string | null) {
  const color = brandColor || '#4A2C23';
  return {
    '--brand-color': color,
    '--brand-soft': `${color}15`,
  } as React.CSSProperties;
}

export function getCoverStyle(coverImageUrl: string | null, brandColor: string | null) {
  const color = brandColor || '#4A2C23';
  if (coverImageUrl)
    return {
      backgroundImage: `url(${coverImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  return {
    background: `linear-gradient(145deg, ${color} 0%, ${color}dd 50%, ${color}bb 100%)`,
  };
}
