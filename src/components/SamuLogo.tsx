import React from 'react';

export const SamuLogo: React.FC<{ className?: string }> = ({ className = "h-10 w-10" }) => {
  return (
    <svg viewBox="0 0 500 500" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Outer orange border */}
      <circle cx="250" cy="250" r="240" fill="#FFFFFF" stroke="#E87C00" strokeWidth="8" />
      
      {/* Top half orange background */}
      <path d="M 10,250 A 240,240 0 0,1 490,250 Z" fill="#E87C00" />
      
      {/* Inner circle to cut out the ring */}
      <circle cx="250" cy="250" r="165" fill="#FFFFFF" />
      <circle cx="250" cy="250" r="165" fill="none" stroke="#E87C00" strokeWidth="6" />
      
      {/* Text paths */}
      <defs>
        {/* Top text path (left to right, sweep 1 goes through top) */}
        <path id="topTextPath" d="M 55,250 A 195,195 0 0,1 445,250" />
        {/* Bottom text path (left to right, sweep 0 goes through bottom) */}
        <path id="bottomTextPath" d="M 35,250 A 215,215 0 0,0 465,250" />
      </defs>
      
      {/* Top Text */}
      <text fill="#FFFFFF" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="26" letterSpacing="2.5">
        <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
          SERVIÇO DE ATENDIMENTO MÓVEL DE URGÊNCIA
        </textPath>
      </text>
      
      {/* Bottom Text */}
      <text fill="#E87C00" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="30" letterSpacing="5">
        <textPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
          SISTEMA ÚNICO DE SAÚDE
        </textPath>
      </text>

      {/* Star of Life */}
      <g transform="translate(250, 250) scale(1.1)">
        {/* Orange border */}
        <path d="M -20,-110 L 20,-110 L 20,-34.64 L 85.26,-72.32 L 105.26,-37.68 L 40,0 L 105.26,37.68 L 85.26,72.32 L 20,34.64 L 20,110 L -20,110 L -20,34.64 L -85.26,72.32 L -105.26,37.68 L -40,0 L -105.26,-37.68 L -85.26,-72.32 L -20,-34.64 Z" 
              fill="none" stroke="#E87C00" strokeWidth="12" strokeLinejoin="round" />
        {/* White border */}
        <path d="M -20,-110 L 20,-110 L 20,-34.64 L 85.26,-72.32 L 105.26,-37.68 L 40,0 L 105.26,37.68 L 85.26,72.32 L 20,34.64 L 20,110 L -20,110 L -20,34.64 L -85.26,72.32 L -105.26,37.68 L -40,0 L -105.26,-37.68 L -85.26,-72.32 L -20,-34.64 Z" 
              fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinejoin="round" />
        {/* Red fill */}
        <path d="M -20,-110 L 20,-110 L 20,-34.64 L 85.26,-72.32 L 105.26,-37.68 L 40,0 L 105.26,37.68 L 85.26,72.32 L 20,34.64 L 20,110 L -20,110 L -20,34.64 L -85.26,72.32 L -105.26,37.68 L -40,0 L -105.26,-37.68 L -85.26,-72.32 L -20,-34.64 Z" 
              fill="#C8102E" />
              
        {/* Rod of Asclepius */}
        {/* Staff */}
        <polygon points="0,-85 8,-70 4,-70 4,75 -4,75 -4,-70 -8,-70" fill="#FFFFFF" />
        {/* Snake */}
        <path d="M -5,55 C -30,35 -30,-5 0,-15 C 30,-25 30,-60 0,-70 C -15,-75 -20,-90 -10,-100 C -5,-105 5,-105 10,-95" 
              fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
      </g>
    </svg>
  );
};
