import React from 'react';

interface FamilyLogoProps {
  className?: string;
  size?: number;
}

/**
 * Logo officiel Famille NTAHUB (Page 1) :
 * - Ruban / arche embrasseuse en noir plein (#000000)
 * - Visages et corps avec les carnations authentiques de la famille :
 *   - Clément & Imanzi : teint pêche chaleureux (#e99f8f)
 *   - Irène & Ishema : teint brun profond (#6e3419 / #783c1d)
 * - Traits et sourires nets avec yeux expressifs
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
      {/* =========================================
          1. CORPS DES 3 PERSONNAGES (PARTIES HAUTES)
          ========================================= */}
      {/* Corps 1 haut (Clément - gauche) */}
      <path
        d="M 78 240 L 78 165 C 78 144 118 144 118 165 L 118 232 Z"
        fill="#e99f8f"
        stroke="#000000"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Corps 2 haut (Imanzi - centre) */}
      <path
        d="M 132 225 L 132 205 C 132 191 168 191 168 205 L 168 216 Z"
        fill="#e99f8f"
        stroke="#000000"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Corps 3 haut (Ishema - droite) */}
      <path
        d="M 188 217 L 188 214 C 188 206 220 206 220 214 L 220 216 Z"
        fill="#783c1d"
        stroke="#000000"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* =========================================
          2. BRAS SUPÉRIEUR DU SWOOSH (PASSE DERRIÈRE LE GRAND CORPS)
          ========================================= */}
      <path
        d="M 118 148 L 242 102 C 252 98 257 113 245 117 L 118 162 Z"
        fill="#000000"
        stroke="#000000"
        strokeWidth="4"
        className="dark:stroke-slate-600"
      />

      {/* =========================================
          3. CORPS DES 3 PERSONNAGES (PARTIES BASSES)
          ========================================= */}
      {/* Corps 1 bas (Clément - gauche) */}
      <path
        d="M 78 276 L 78 328 C 78 358 118 358 118 328 L 118 266 Z"
        fill="#e99f8f"
        stroke="#000000"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Corps 2 bas (Imanzi - centre) */}
      <path
        d="M 132 252 L 132 322 C 132 352 168 352 168 322 L 168 240 Z"
        fill="#e99f8f"
        stroke="#000000"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Corps 3 bas (Ishema - droite) */}
      <path
        d="M 188 231 L 188 316 C 188 346 220 346 220 316 L 220 218 Z"
        fill="#783c1d"
        stroke="#000000"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* =========================================
          4. ARCHE / SWOOSH EN NOIR PLEIN (PASSE DEVANT)
          ========================================= */}
      <path
        d="M 78 165
           C 48 180 23 212 23 242
           C 23 274 54 290 85 284
           L 282 208
           C 292 204 286 186 274 191
           L 80 263
           C 64 269 46 257 46 240
           C 46 225 57 206 78 196
           Z"
        fill="#000000"
        stroke="#000000"
        strokeWidth="4"
        className="dark:stroke-slate-600"
      />

      {/* =========================================
          5. LES 4 TÊTES SOURIANTES
          ========================================= */}
      {/* Tête 1 (Clément - haut gauche) */}
      <g stroke="#000000" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="98" cy="115" r="21" fill="#e99f8f" />
        <circle cx="91" cy="110" r="3.2" fill="#000000" stroke="none" />
        <circle cx="105" cy="110" r="3.2" fill="#000000" stroke="none" />
        <path d="M 89 119 Q 98 129 107 119" strokeWidth="6" fill="none" />
      </g>

      {/* Tête 2 (Irène - haut droit) */}
      <g stroke="#000000" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="150" cy="104" r="21" fill="#6e3419" />
        <circle cx="143" cy="99" r="3.2" fill="#000000" stroke="none" />
        <circle cx="157" cy="99" r="3.2" fill="#000000" stroke="none" />
        <path d="M 141 108 Q 150 118 159 108" strokeWidth="6" fill="none" />
      </g>

      {/* Tête 3 (Imanzi - centre) */}
      <g stroke="#000000" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="150" cy="166" r="21" fill="#e99f8f" />
        <circle cx="143" cy="161" r="3.2" fill="#000000" stroke="none" />
        <circle cx="157" cy="161" r="3.2" fill="#000000" stroke="none" />
        <path d="M 141 170 Q 150 180 159 170" strokeWidth="6" fill="none" />
      </g>

      {/* Tête 4 (Ishema - droite) */}
      <g stroke="#000000" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="204" cy="184" r="20" fill="#783c1d" />
        <circle cx="197" cy="179" r="3.2" fill="#000000" stroke="none" />
        <circle cx="211" cy="180" r="3.2" fill="#000000" stroke="none" />
        <path d="M 197 189 Q 204 198 212 191" strokeWidth="6" fill="none" />
      </g>
    </svg>
  );
};
