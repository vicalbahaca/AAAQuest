
import React, { useEffect, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  duration?: number;
  threshold?: number; // Kept for compatibility, but ignored
}

export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, className = "", duration = 800 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger visibility immediately after mount instead of waiting for scroll
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100); // Small buffer to ensure smooth transition

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`transition-all cubic-bezier(0.2, 0.8, 0.2, 1) transform will-change-transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDuration: `${duration}ms`, transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};
