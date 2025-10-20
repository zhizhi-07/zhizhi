import React from 'react';
import './ElectricBorder.css';

interface ElectricBorderProps {
  children: React.ReactNode;
  className?: string;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
}

const ElectricBorder: React.FC<ElectricBorderProps> = ({
  children,
  className = '',
  borderColor = '#00ffff',
  glowColor = '#00ffff',
  animationDuration = 3,
}) => {
  return (
    <div className={`electric-border-container ${className}`}>
      <svg className="electric-border-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect
          className="electric-border-rect"
          x="2"
          y="2"
          rx="12"
          ry="12"
          style={{
            stroke: borderColor,
            filter: `drop-shadow(0 0 8px ${glowColor})`,
            animationDuration: `${animationDuration}s`,
          }}
        />
      </svg>
      <div className="electric-border-content">{children}</div>
    </div>
  );
};

export default ElectricBorder;
