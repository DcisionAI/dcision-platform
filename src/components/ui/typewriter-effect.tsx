import React, { useState, useEffect } from 'react';

interface TypewriterEffectProps {
  text: string;
  typingSpeed?: number;
  delay?: number;
}

export const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  text,
  typingSpeed = 30,
  delay = 0,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!text) return;

    // Reset state when text changes
    setDisplayedText('');
    setCurrentIndex(0);

    // Initial delay before starting to type
    const initialDelay = setTimeout(() => {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          if (prevIndex >= text.length) {
            clearInterval(interval);
            return prevIndex;
          }
          setDisplayedText((prev) => prev + text[prevIndex]);
          return prevIndex + 1;
        });
      }, typingSpeed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(initialDelay);
  }, [text, typingSpeed, delay]);

  return <div>{displayedText}</div>;
}; 