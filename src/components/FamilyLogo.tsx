import React from 'react';

interface FamilyLogoProps {
  className?: string;
  size?: number;
}

/**
 * Logo officiel NTAHUB sans fond :
 * Famille de 4 membres (Clément, Irène, Imanzi, Ishema)
 * enlacés dans une arche dynamique en forme de C / aile.
 */
export const FamilyLogo: React.FC<FamilyLogoProps> = ({
  className = 'h-10 w-auto',
  size,
}) => {
  return (
    <svg
      viewBox="0 0 320 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { height: size, width: (size * 320) / 400 } : undefined}
      aria-label="Logo Famille NTAHUB"
    >
      {/* 1. LES 4 TÊTES SOURIANTES */}

      {/* Tête 1 (Adulte gauche - Clément) */}
      <g stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="98" cy="115" r="21" />
        <circle cx="91" cy="110" r="3.2" fill="currentColor" stroke="none" />
        <circle cx="105" cy="110" r="3.2" fill="currentColor" stroke="none" />
        <path d="M 89 119 Q 98 129 107 119" strokeWidth="6" />
      </g>

      {/* Tête 2 (Adulte droit - Irène) - posée au-dessus de l'arche supérieure */}
      <g stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="150" cy="104" r="21" />
        <circle cx="143" cy="99" r="3.2" fill="currentColor" stroke="none" />
        <circle cx="157" cy="99" r="3.2" fill="currentColor" stroke="none" />
        <path d="M 141 108 Q 150 118 159 108" strokeWidth="6" />
      </g>

      {/* Tête 3 (Enfant centre - Imanzi) */}
      <g stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="150" cy="166" r="21" />
        <circle cx="143" cy="161" r="3.2" fill="currentColor" stroke="none" />
        <circle cx="157" cy="161" r="3.2" fill="currentColor" stroke="none" />
        <path d="M 141 170 Q 150 180 159 170" strokeWidth="6" />
      </g>

      {/* Tête 4 (Enfant droite - Ishema) */}
      <g stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="204" cy="184" r="20" />
        <circle cx="197" cy="179" r="3.2" fill="currentColor" stroke="none" />
        <circle cx="211" cy="180" r="3.2" fill="currentColor" stroke="none" />
        <path d="M 197 189 Q 204 198 212 191" strokeWidth="6" />
      </g>

      {/* 2. CORPS SUPÉRIEURS (au-dessus du ruban inférieur) */}
      <g stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        {/* Corps 1 haut (Grand adulte) */}
        <path d="M 78 240 L 78 165 C 78 144 118 144 118 165 L 118 232" />

        {/* Corps 2 haut (Enfant centre) */}
        <path d="M 132 225 L 132 205 C 132 191 168 191 168 205 L 168 216" />

        {/* Corps 3 haut (Enfant droite) */}
        <path d="M 188 217 L 188 214 C 188 206 220 206 220 214 L 220 216" />
      </g>

      {/* 3. ARCHE / SWOOSH EN "C" EMBRASSEUR */}
      <g stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        {/* Bras supérieur droit (qui passe derrière le grand corps) */}
        <path d="M 118 148 L 242 102 C 252 98 257 113 245 117 L 118 162" />

        {/* Boucle gauche + Bras inférieur complet passant DEVANT les 3 corps */}
        <path
          d="M 78 165
             C 48 180 23 212 23 242
             C 23 274 54 290 85 284
             L 282 208
             C 292 204 286 186 274 191
             L 80 263
             C 64 269 46 257 46 240
             C 46 225 57 206 78 196"
        />
      </g>

      {/* 4. CORPS INFÉRIEURS (émergeant sous le ruban inférieur) */}
      <g stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        {/* Corps 1 bas (Grand adulte) */}
        <path d="M 78 276 L 78 328 C 78 358 118 358 118 328 L 118 266" />

        {/* Corps 2 bas (Enfant centre) */}
        <path d="M 132 252 L 132 322 C 132 352 168 352 168 322 L 168 240" />

        {/* Corps 3 bas (Enfant droite) */}
        <path d="M 188 231 L 188 316 C 188 346 220 346 220 316 L 220 218" />
      </g>
    </svg>
  );
};
