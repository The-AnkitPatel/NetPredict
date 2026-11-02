import React from 'react';

interface CheckIconProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Exact Checkmark SVG asset inherited from cisco_hostel ecosystem.
 * Represents verified engineering compliance, benchmark pass, and nominal state.
 */
export const CheckIcon: React.FC<CheckIconProps> = ({
  size = 11,
  className = '',
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 800 800"
    fill="currentColor"
    className={className}
    style={{ display: 'inline-block', verticalAlign: '-0.1em', flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    <polygon points="38,344 290.5,596.5 761,126 799,164 290.5,672.5 0,382" />
  </svg>
);
