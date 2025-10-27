import { useState, useCallback, useEffect, useRef } from 'react';

interface UseOptimizedInputOptions {
  debounceMs?: number;
  maxLength?: number;
  validateOnChange?: boolean;
  trimWhitespace?: boolean;
}

interface UseOptimizedInputReturn {
  value: string;
  displayValue: string;
  handleChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isTyping: boolean;
  error?: string;
}

export const useOptimizedInput = (
  initialValue: string,
  onValueChange: (value: string) => void,
  options: UseOptimizedInputOptions = {}
): UseOptimizedInputReturn => {
  const {
    debounceMs = 300,
    maxLength,
    validateOnChange = false,
    trimWhitespace = true
  } = options;

  const [displayValue, setDisplayValue] = useState(initialValue || '');
  const [value, setValue] = useState(initialValue || '');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const lastValueRef = useRef(initialValue);
  const isInternalUpdateRef = useRef(false);

  // Sync with external value changes only when not actively typing
  useEffect(() => {
    // Prevent sync during internal updates
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    // Only sync if we're not typing AND the new value is different
    if (!isTyping && initialValue !== lastValueRef.current) {
      setDisplayValue(initialValue || '');
      setValue(initialValue || '');
      lastValueRef.current = initialValue;
    }
  }, [initialValue, isTyping]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const validate = useCallback((inputValue: string): string | undefined => {
    if (maxLength && inputValue.length > maxLength) {
      return `Maximum ${maxLength} characters allowed`;
    }
    return undefined;
  }, [maxLength]);

  const handleChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const inputValue = event.target.value;
    
    // Immediate validation for character limits
    const validationError = validate(inputValue);
    if (validationError) {
      setError(validationError);
      return; // Don't update if invalid
    } else {
      setError(undefined);
    }

    setDisplayValue(inputValue);
    setIsTyping(true);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      const finalValue = trimWhitespace ? inputValue.trim() : inputValue;
      
      // Only call onChange if the value actually changed
      if (finalValue !== lastValueRef.current) {
        isInternalUpdateRef.current = true;
        setValue(finalValue);
        lastValueRef.current = finalValue;
        onValueChange(finalValue);
      }
      
      setIsTyping(false);
    }, debounceMs);
  }, [onValueChange, debounceMs, trimWhitespace, validate]);

  const handleBlur = useCallback((
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    // Force immediate update on blur
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    const finalValue = trimWhitespace ? displayValue.trim() : displayValue;
    
    // Only call onChange if the value actually changed
    if (finalValue !== lastValueRef.current) {
      isInternalUpdateRef.current = true;
      setValue(finalValue);
      lastValueRef.current = finalValue;
      onValueChange(finalValue);
    }
    
    setDisplayValue(finalValue);
    setIsTyping(false);
  }, [displayValue, onValueChange, trimWhitespace]);

  return {
    value,
    displayValue,
    handleChange,
    handleBlur,
    isTyping,
    error,
  };
};

export default useOptimizedInput;