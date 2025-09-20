import React, { useState, useEffect } from 'react';
import { OperatorColorIndicator } from './ColorIndicator';
import { COLOR_PALETTE, PatternType } from '@/utils/entityColors';
import { validateColorPatternUniqueness, getValidationErrorMessage, ValidationResult } from '@/utils/colorValidation';

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
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true });
  const [isValidating, setIsValidating] = useState(false);

  // Validate color/pattern combination whenever they change
  useEffect(() => {
    const validateCombination = async () => {
      if (!color || !pattern) return;

      setIsValidating(true);
      const result = await validateColorPatternUniqueness(
        color,
        pattern,
        entityType,
        entityId, // Exclude current entity in edit mode
      );

      setValidationResult(result);
      setIsValidating(false);
      onValidationChange?.(result.isValid);
    };

    // Debounce validation to avoid too many API calls
    const timeoutId = setTimeout(validateCombination, 500);
    return () => clearTimeout(timeoutId);
  }, [color, pattern, entityType, entityId, onValidationChange]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Visual Identifier {!validationResult.isValid && <span className="text-red-500">*</span>}
      </label>
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

        {/* Validation Message */}
        {!validationResult.isValid && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{getValidationErrorMessage(validationResult)}</p>
              </div>
            </div>
          </div>
        )}

        {isValidating && <div className="mt-2 text-sm text-gray-500">Checking availability...</div>}
      </div>
    </div>
  );
}
