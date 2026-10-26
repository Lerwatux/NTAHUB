import React from 'react';

export interface NtahubWordmarkProps {
  className?: string;
  height?: number;
  /**
   * 'banner' : version horizontale vectorielle (SVG) avec fond bleu nuit #14304d
   * 'square' : version carrée 500x500 officielle en JPEG
   */
  variant?: 'banner' | 'square';
}

/**
 * Logo officiel "NTAHUB" en format JPEG :
 * - Fond bleu nuit officiel (#182c47)
 * - N, T, A : typographie blanche dynamique
 * - H : double flèches montantes (flèche blanche verticale + flèche montante verte #22C55E)
 * - U, B : vert dynamique (#22C55E)
 */
export const NtahubWordmark: React.FC<NtahubWordmarkProps> = ({
  className = 'h-[33px] w-auto',
  height = 33,
  variant = 'banner',
}) => {
  const imageSrc = variant === 'square' ? '/logo_ntahub.jpg' : '/logo_ntahub_banner.svg';

  return (
    <img
      src={imageSrc}
      alt="Logo NTAHUB"
      className={`${className} rounded-md object-contain shadow-2xs select-none`}
      style={height ? { height } : undefined}
      referrerPolicy="no-referrer"
    />
  );
};
