// widget/src/components/Ticker.jsx
import React, { useState, useEffect, useRef } from 'react';

const Ticker = ({ config, flightStatusUpdates }) => {
  const [currentText, setCurrentText] = useState(config.userTicker);
  const [showUserTicker, setShowUserTicker] = useState(true);
  const tickerRef = useRef(null);
  const animationRef = useRef(null);
  const positionRef = useRef(0);

  useEffect(() => {
    if (tickerRef.current) {
      startAnimation();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [config.userTickerDirection, config.userTickerSpeed]);

  useEffect(() => {
    // Update ticker text based on configuration
    updateTickerText();
  }, [config, flightStatusUpdates, showUserTicker]);

  const updateTickerText = () => {
    if (config.showDefaultTicker && flightStatusUpdates.length > 0) {
      if (showUserTicker) {
        setCurrentText(config.userTicker);
      } else {
        // Rotate through flight status updates
        const randomIndex = Math.floor(Math.random() * flightStatusUpdates.length);
        setCurrentText(flightStatusUpdates[randomIndex]);
      }
    } else {
      setCurrentText(config.userTicker);
    }
  };

  const startAnimation = () => {
    const tickerText = tickerRef.current;
    if (!tickerText) return;

    const containerWidth = window.innerWidth;
    const textWidth = tickerText.offsetWidth;
    
    // Reset position based on direction
    positionRef.current = config.userTickerDirection === "left" 
      ? containerWidth 
      : -textWidth;

    const animate = () => {
      if (config.userTickerDirection === "left") {
        positionRef.current -= config.userTickerSpeed / 10;
        if (positionRef.current < -textWidth) {
          positionRef.current = containerWidth;
          // Switch between user ticker and flight updates
          if (config.showDefaultTicker && flightStatusUpdates.length > 0) {
            setShowUserTicker(prev => !prev);
          }
        }
      } else {
        positionRef.current += config.userTickerSpeed / 10;
        if (positionRef.current > containerWidth) {
          positionRef.current = -textWidth;
          // Switch between user ticker and flight updates
          if (config.showDefaultTicker && flightStatusUpdates.length > 0) {
            setShowUserTicker(prev => !prev);
          }
        }
      }

      if (tickerText) {
        tickerText.style.transform = `translateX(${positionRef.current}px)`;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <div id="ticker">
      <span 
        id="ticker-text" 
        ref={tickerRef}
        style={{ 
          whiteSpace: 'nowrap',
          display: 'inline-block',
          transform: `translateX(${positionRef.current}px)`
        }}
      >
        {currentText}
      </span>
    </div>
  );
};

export default Ticker;