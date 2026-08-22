import React from 'react';

export const CollapsibleSection = ({ isOpen, children, className = '' }) => {
  return (
    <div className={`grid transition-all duration-500 ease-in-out ${
      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
    }`}>
      <div className="overflow-hidden">
        <div className={className}>
          {children}
        </div>
      </div>
    </div>
  );
};
