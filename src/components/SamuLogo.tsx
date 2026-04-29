import React from 'react';

export const SamuLogo: React.FC<{ className?: string }> = ({ className = "h-10 w-10" }) => {
  return (
    <img 
      src="https://i.pinimg.com/originals/cb/b0/f4/cbb0f4c4a7e05d4635ec4c53c6e26baf.png" 
      alt="SAMU 192 Logo" 
      className={className}
      referrerPolicy="no-referrer"
    />
  );
};
