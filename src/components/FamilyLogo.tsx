import React from 'react';

interface FamilyLogoProps {
  className?: string;
  size?: number;
}

/**
 * Logo officiel Famille NTAHUB (vectoriel, exporté depuis Figma) :
 * - Ruban / arche embrasseuse en noir plein
 * - Quatre personnages souriants aux carnations de la famille
 */
export const FamilyLogo: React.FC<FamilyLogoProps> = ({
  className = 'h-10 w-auto',
  size,
}) => {
  return (
    <img
      src="/logo_famille.svg"
      alt="Logo Famille NTAHUB"
      className={`${className} object-contain select-none`}
      style={size ? { height: size } : undefined}
      draggable={false}
    />
  );
};
