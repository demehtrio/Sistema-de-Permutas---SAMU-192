import React from 'react';

export const SamuLogo: React.FC<{ className?: string }> = ({ className = "h-10 w-10" }) => {
  return (
    <svg viewBox="0 0 512 512" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="256" cy="256" r="248" fill="#E87C00" />
      <circle cx="256" cy="256" r="238" fill="#FFFFFF" />
      <path d="M 18,256 A 238,238 0 0,1 494,256 Z" fill="#E87C00" />
      <circle cx="256" cy="256" r="168" fill="#FFFFFF" stroke="#E87C00" strokeWidth="6" />

      <defs>
        <path id="topTextPathComp" d="M 76,256 A 180,180 0 0,1 436,256" />
        <path id="bottomTextPathComp" d="M 56,256 A 200,200 0 0,0 456,256" />
      </defs>

      <text fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="18" textAnchor="middle">
        <textPath href="#topTextPathComp" startOffset="50%" fill="#FFFFFF">SERVIÇO DE ATENDIMENTO MÓVEL DE URGÊNCIA</textPath>
      </text>

      <text fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="22" textAnchor="middle">
        <textPath href="#bottomTextPathComp" startOffset="50%" fill="#E87C00">SISTEMA ÚNICO DE SAÚDE</textPath>
      </text>

      <g transform="translate(256, 256) scale(1.1)">
        <path d="M -20,-110 L 20,-110 L 20,-34.64 L 85.26,-72.32 L 105.26,-37.68 L 40,0 L 105.26,37.68 L 85.26,72.32 L 20,34.64 L 20,110 L -20,110 L -20,34.64 L -85.26,72.32 L -105.26,37.68 L -40,0 L -105.26,-37.68 L -85.26,-72.32 L -20,-34.64 Z" 
              fill="#C8102E" stroke="#FFFFFF" strokeWidth="8" strokeLinejoin="round" />
        <polygon points="0,-85 8,-70 4,-70 4,75 -4,75 -4,-70 -8,-70" fill="#FFFFFF" />
        <path d="M -5,55 C -30,35 -30,-5 0,-15 C 30,-25 30,-60 0,-70 C -15,-75 -20,-90 -10,-100 C -5,-105 5,-105 10,-95" 
              fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
      </g>
    </svg>
  );
};
