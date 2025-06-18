'use client';

import * as React from 'react';

interface PercentageSliderProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function PercentageSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className = '',
}: PercentageSliderProps) {
  const [sliderValue, setSliderValue] = React.useState(Number(value) || min);

  // Update internal state when value prop changes
  React.useEffect(() => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setSliderValue(numValue);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSliderValue(Number(newValue));
    onChange(newValue);
  };

  // Generate markers for every 10%
  const markers = [];
  for (let i = min; i <= max; i += 10) {
    markers.push(i);
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={sliderValue}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={sliderValue}
        />
        
        {/* Markers */}
        <div className="flex justify-between w-full px-1 mt-1">
          {markers.map((mark) => (
            <div key={mark} className="flex flex-col items-center">
              <div className="w-px h-2 bg-gray-400"></div>
              <span className="text-xs text-gray-400 mt-1">{mark}%</span>
            </div>
          ))}
        </div>
        
        {/* Current value indicator */}
        <div className="mt-4 text-center">
          <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-primary/20 text-primary">
            {sliderValue}%
          </span>
        </div>
      </div>
    </div>
  );
}
