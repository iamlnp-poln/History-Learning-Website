import React from 'react';

interface SimpleMarkdownProps {
  text: string;
  className?: string;
}

const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ text, className = "" }) => {
  // Split text by **bold** markers
  // FIX: Add a guard for text to ensure it's a string, preventing potential runtime errors.
  const parts = String(text || '').split(/(\*\*.*?\*\*)/g);
  
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // Remove ** and render bold text
          return <strong key={i} className="font-bold text-history-red">{part.slice(2, -2)}</strong>;
        }
        // Render normal text
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

export default SimpleMarkdown;