import React from 'react';
import { OperatorColorIndicator } from './ColorIndicator';
import { COLOR_PALETTE, PatternType } from '@/utils/entityColors';

interface VisualIdentifierProps {
  color: string;
  pattern: PatternType;
  onColorChange: (color: string) => void;
  onPatternChange: (pattern: PatternType) => void;
  previewName?: string;
}

const PATTERN_OPTIONS = [
  { value: 'solid' as const, label: 'Solid' },
  { value: 'diagonalLeft' as const, label: 'Diagonal Left' },
  { value: 'diagonalRight' as const, label: 'Diagonal Right' },
  { value: 'horizontal' as const, label: 'Horizontal' },
  { value: 'vertical' as const, label: 'Vertical' },
] satisfies { value: PatternType; label: string }[];

export default function VisualIdentifier({
  color,
  pattern,
  onColorChange,
  onPatternChange,
  previewName = 'Preview',
}: VisualIdentifierProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">Visual Identifier</label>
      <div className="space-y-4">
        {/* Color Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Color</label>
          <div className="grid grid-cols-10 gap-2">
            {COLOR_PALETTE.map((colorOption) => (
              <button
                key={colorOption.hex}
                type="button"
                onClick={() => onColorChange(colorOption.hex)}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                  color === colorOption.hex ? 'border-gray-800 scale-110' : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: colorOption.hex }}
              />
            ))}
          </div>
        </div>

        {/* Pattern Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Pattern</label>
          <div className="grid grid-cols-4 gap-2">
            {PATTERN_OPTIONS.map((patternOption) => (
              <button
                key={patternOption.value}
                type="button"
                onClick={() => onPatternChange(patternOption.value)}
                className={`px-3 py-2 text-xs font-medium rounded-md border transition-all ${
                  pattern === patternOption.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}>
                {patternOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-500">Preview:</span>
          <OperatorColorIndicator
            operator={{
              id: 'preview',
              color: color,
              pattern: pattern,
            }}
            size="lg"
          />
          <span className="text-sm text-gray-600">{previewName}</span>
        </div>
      </div>
    </div>
  );
}
