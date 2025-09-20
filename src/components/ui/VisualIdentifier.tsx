import React, { useState, useEffect } from 'react';
import { OperatorColorIndicator } from './ColorIndicator';
import { COLOR_PALETTE, PatternType } from '@/utils/entityColors';
import {
  getColorPatternAvailability,
  isColorAvailable,
  getAvailablePatternsForColor,
  ColorPatternAvailability,
} from '@/utils/colorValidation';

interface VisualIdentifierProps {
  color: string;
  pattern: PatternType;
  onColorChange: (color: string) => void;
  onPatternChange: (pattern: PatternType) => void;
  previewName?: string;
  entityType?: 'operator' | 'machine';
  entityId?: string; // For edit mode, to exclude current entity from validation
  onValidationChange?: (isValid: boolean) => void;
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
  entityType = 'operator',
  entityId,
  onValidationChange,
}: VisualIdentifierProps) {
  const [availability, setAvailability] = useState<ColorPatternAvailability>({
    usedCombinations: [],
    availablePatterns: {},
    availableColors: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch availability data when component mounts or when entityId changes
  useEffect(() => {
    const fetchAvailability = async () => {
      setIsLoading(true);
      const data = await getColorPatternAvailability(entityType, entityId);
      setAvailability(data);
      setIsLoading(false);
    };

    fetchAvailability();
  }, [entityType, entityId]);

  // Validate current selection and notify parent
  useEffect(() => {
    if (!color || !pattern) {
      onValidationChange?.(false);
      return;
    }

    const isValid =
      availability.usedCombinations.length === 0 ||
      !availability.usedCombinations.some((combo) => combo.color === color && combo.pattern === pattern);

    onValidationChange?.(isValid);
  }, [color, pattern, availability, onValidationChange]);

  // Get available patterns for the selected color
  const availablePatternsForSelectedColor = color ? getAvailablePatternsForColor(color, availability) : [];

  // Handle color selection
  const handleColorChange = (newColor: string) => {
    onColorChange(newColor);

    // If the current pattern is not available for the new color, select the first available pattern
    const availablePatterns = getAvailablePatternsForColor(newColor, availability);
    if (availablePatterns.length > 0 && !availablePatterns.includes(pattern)) {
      onPatternChange(availablePatterns[0]);
    }
  };

  if (isLoading) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Visual Identifier</label>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="grid grid-cols-10 gap-2">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">Visual Identifier *</label>
      <div className="space-y-4">
        {/* Color Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Color</label>
          <div className="grid grid-cols-10 gap-2">
            {COLOR_PALETTE.map((colorOption) => {
              const colorAvailable = isColorAvailable(colorOption.hex, availability);
              return (
                <button
                  key={colorOption.hex}
                  type="button"
                  onClick={() => (colorAvailable ? handleColorChange(colorOption.hex) : undefined)}
                  disabled={!colorAvailable}
                  className={`w-8 h-8 rounded-lg border-2 transition-all relative ${
                    color === colorOption.hex
                      ? 'border-gray-800 scale-110'
                      : colorAvailable
                      ? 'border-gray-300 hover:border-gray-400 cursor-pointer'
                      : 'border-gray-200 cursor-not-allowed opacity-50'
                  }`}
                  style={{ backgroundColor: colorOption.hex }}
                  title={
                    colorAvailable
                      ? `${colorOption.hex} - Available`
                      : `${colorOption.hex} - All patterns used by other ${entityType}s`
                  }>
                  {!colorAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-0.5 bg-red-500 rotate-45 absolute"></div>
                      <div className="w-6 h-0.5 bg-red-500 -rotate-45 absolute"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pattern Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Pattern</label>
          <div className="grid grid-cols-4 gap-2">
            {PATTERN_OPTIONS.map((patternOption) => {
              const patternAvailable = !color || availablePatternsForSelectedColor.includes(patternOption.value);
              return (
                <button
                  key={patternOption.value}
                  type="button"
                  onClick={() => (patternAvailable ? onPatternChange(patternOption.value) : undefined)}
                  disabled={!patternAvailable}
                  className={`px-3 py-2 text-xs font-medium rounded-md border transition-all ${
                    pattern === patternOption.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : patternAvailable
                      ? 'border-gray-300 text-gray-700 hover:border-gray-400 cursor-pointer'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                  title={
                    patternAvailable
                      ? `${patternOption.label} - Available`
                      : `${patternOption.label} - Already used with this color by another ${entityType}`
                  }>
                  {patternOption.label}
                  {!patternAvailable && ' ✗'}
                </button>
              );
            })}
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

        {/* Usage Information */}
        {color && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              <p className="font-medium">Available patterns for this color:</p>
              <p>
                {availablePatternsForSelectedColor.length > 0
                  ? availablePatternsForSelectedColor
                      .map((p) => PATTERN_OPTIONS.find((opt) => opt.value === p)?.label)
                      .join(', ')
                  : `No patterns available for this color (all used by other ${entityType}s)`}
              </p>
              <p className="text-xs mt-1 text-blue-600">
                Note: You can use colors/patterns from {entityType === 'operator' ? 'machines' : 'operators'}, only
                conflicts with other {entityType}s are prevented.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
