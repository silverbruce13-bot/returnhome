import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', id }) => {
  return (
    <div id={id} className={`bg-slate-800 rounded-xl overflow-hidden ${className}`}>
      <div className="p-6 md:p-8">
        {children}
      </div>
    </div>
  );
};

export default Card;