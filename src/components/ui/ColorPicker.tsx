'use client';

import { useState } from 'react';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  usedColors: string[];
  error?: string;
}

const COLOR_PALETTE = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#C026D3', '#DB2777', '#E11D48', '#DC2626',
  '#EA580C', '#D97706', '#CA8A04', '#65A30D', '#16A34A', '#059669'
];

export default function ColorPicker({ selectedColor, onColorChange, usedColors, error }: ColorPickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#000000');

  const handlePresetColorClick = (color: string) => {
    if (!usedColors.includes(color)) {
      onColorChange(color);
      setShowCustomPicker(false);
    }
  };

  const handleCustomColorSubmit = () => {
    if (!usedColors.includes(customColor)) {
      onColorChange(customColor);
      setShowCustomPicker(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Project Color
      </label>
      
      {/* Color Preview */}
      <div className="flex items-center space-x-3">
        <div 
          className="w-8 h-8 rounded-lg border-2 border-gray-300"
          style={{ backgroundColor: selectedColor || '#E5E7EB' }}
        />
        <span className="text-sm text-gray-600">
          {selectedColor || 'No color selected'}
        </span>
      </div>

      {/* Preset Colors Grid */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Choose from palette:</h4>
        <div className="grid grid-cols-6 gap-2">
          {COLOR_PALETTE.map((color) => {
            const isUsed = usedColors.includes(color);
            const isSelected = selectedColor === color;
            
            return (
              <button
                key={color}
                type="button"
                onClick={() => handlePresetColorClick(color)}
                disabled={isUsed}
                className={`
                  w-10 h-10 rounded-lg border-2 transition-all duration-200
                  ${isSelected ? 'border-gray-800 scale-110' : 'border-gray-300'}
                  ${isUsed ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                `}
                style={{ backgroundColor: color }}
                title={isUsed ? 'Color already in use' : `Select ${color}`}
              >
                {isUsed && (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-xs">✕</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Section */}
      <div>
        <button
          type="button"
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showCustomPicker ? 'Hide custom color' : 'Use custom color'}
        </button>
        
        {showCustomPicker && (
          <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="#000000"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <button
                type="button"
                onClick={handleCustomColorSubmit}
                disabled={usedColors.includes(customColor)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Use Color
              </button>
            </div>
            {usedColors.includes(customColor) && (
              <p className="text-sm text-red-600 mt-2">This color is already in use</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
