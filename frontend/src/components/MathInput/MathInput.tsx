import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Paper,
  Grid,
  Button,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  ButtonGroup
} from '@mui/material';
import {
  Functions,
  Clear,
  Backspace,
  KeyboardArrowLeft,
  KeyboardArrowRight
} from '@mui/icons-material';

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  label?: string;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
}

const MathInput: React.FC<MathInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter your mathematical expression...',
  disabled = false,
  error = false,
  helperText,
  label,
  fullWidth = true,
  multiline = false,
  rows = 1
}) => {
  const [showSymbolPad, setShowSymbolPad] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mathematical symbols organized by category
  const symbols = {
    basic: [
      { symbol: '+', label: 'Plus' },
      { symbol: '-', label: 'Minus' },
      { symbol: '×', label: 'Multiply' },
      { symbol: '÷', label: 'Divide' },
      { symbol: '=', label: 'Equals' },
      { symbol: '≠', label: 'Not equal' },
      { symbol: '±', label: 'Plus minus' },
      { symbol: '∓', label: 'Minus plus' }
    ],
    comparison: [
      { symbol: '<', label: 'Less than' },
      { symbol: '>', label: 'Greater than' },
      { symbol: '≤', label: 'Less than or equal' },
      { symbol: '≥', label: 'Greater than or equal' },
      { symbol: '≈', label: 'Approximately equal' },
      { symbol: '∝', label: 'Proportional to' }
    ],
    powers: [
      { symbol: '²', label: 'Squared' },
      { symbol: '³', label: 'Cubed' },
      { symbol: 'ⁿ', label: 'To the power of n' },
      { symbol: '√', label: 'Square root' },
      { symbol: '∛', label: 'Cube root' },
      { symbol: 'ⁿ√', label: 'nth root' }
    ],
    fractions: [
      { symbol: '½', label: 'One half' },
      { symbol: '⅓', label: 'One third' },
      { symbol: '¼', label: 'One quarter' },
      { symbol: '¾', label: 'Three quarters' },
      { symbol: '⅕', label: 'One fifth' },
      { symbol: '⅛', label: 'One eighth' }
    ],
    greek: [
      { symbol: 'α', label: 'Alpha' },
      { symbol: 'β', label: 'Beta' },
      { symbol: 'γ', label: 'Gamma' },
      { symbol: 'δ', label: 'Delta' },
      { symbol: 'π', label: 'Pi' },
      { symbol: 'θ', label: 'Theta' },
      { symbol: 'λ', label: 'Lambda' },
      { symbol: 'μ', label: 'Mu' },
      { symbol: 'σ', label: 'Sigma' },
      { symbol: 'φ', label: 'Phi' },
      { symbol: 'ω', label: 'Omega' }
    ],
    calculus: [
      { symbol: '∫', label: 'Integral' },
      { symbol: '∂', label: 'Partial derivative' },
      { symbol: '∇', label: 'Nabla' },
      { symbol: '∞', label: 'Infinity' },
      { symbol: '∑', label: 'Sum' },
      { symbol: '∏', label: 'Product' },
      { symbol: 'lim', label: 'Limit' },
      { symbol: 'log', label: 'Logarithm' },
      { symbol: 'ln', label: 'Natural log' },
      { symbol: 'sin', label: 'Sine' },
      { symbol: 'cos', label: 'Cosine' },
      { symbol: 'tan', label: 'Tangent' }
    ],
    sets: [
      { symbol: '∈', label: 'Element of' },
      { symbol: '∉', label: 'Not element of' },
      { symbol: '⊂', label: 'Subset of' },
      { symbol: '⊃', label: 'Superset of' },
      { symbol: '∪', label: 'Union' },
      { symbol: '∩', label: 'Intersection' },
      { symbol: '∅', label: 'Empty set' },
      { symbol: 'ℕ', label: 'Natural numbers' },
      { symbol: 'ℤ', label: 'Integers' },
      { symbol: 'ℚ', label: 'Rational numbers' },
      { symbol: 'ℝ', label: 'Real numbers' }
    ],
    brackets: [
      { symbol: '(', label: 'Left parenthesis' },
      { symbol: ')', label: 'Right parenthesis' },
      { symbol: '[', label: 'Left bracket' },
      { symbol: ']', label: 'Right bracket' },
      { symbol: '{', label: 'Left brace' },
      { symbol: '}', label: 'Right brace' },
      { symbol: '|', label: 'Absolute value' },
      { symbol: '⌊', label: 'Floor' },
      { symbol: '⌋', label: 'Floor close' },
      { symbol: '⌈', label: 'Ceiling' },
      { symbol: '⌉', label: 'Ceiling close' }
    ]
  };

  // Insert symbol at cursor position
  const insertSymbol = (symbol: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    
    const newValue = value.substring(0, start) + symbol + value.substring(end);
    onChange(newValue);
    
    // Set cursor position after inserted symbol
    setTimeout(() => {
      const newPosition = start + symbol.length;
      input.setSelectionRange(newPosition, newPosition);
      input.focus();
    }, 0);
  };

  // Clear all input
  const clearAll = () => {
    onChange('');
    inputRef.current?.focus();
  };

  // Delete last character
  const deleteLast = () => {
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
    inputRef.current?.focus();
  };

  // Handle cursor position changes
  const handleSelectionChange = () => {
    const input = inputRef.current;
    if (input) {
      setCursorPosition(input.selectionStart || 0);
    }
  };

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.addEventListener('selectionchange', handleSelectionChange);
      return () => {
        input.removeEventListener('selectionchange', handleSelectionChange);
      };
    }
  }, []);

  return (
    <Box>
      <TextField
        inputRef={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        helperText={helperText}
        label={label}
        fullWidth={fullWidth}
        multiline={multiline}
        rows={rows}
        variant="outlined"
        InputProps={{
          endAdornment: (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Mathematical Symbols">
                <IconButton
                  onClick={() => setShowSymbolPad(!showSymbolPad)}
                  color={showSymbolPad ? 'primary' : 'default'}
                  size="small"
                >
                  <Functions />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear All">
                <IconButton onClick={clearAll} size="small">
                  <Clear />
                </IconButton>
              </Tooltip>
              <Tooltip title="Backspace">
                <IconButton onClick={deleteLast} size="small">
                  <Backspace />
                </IconButton>
              </Tooltip>
            </Box>
          )
        }}
        sx={{
          '& .MuiInputBase-input': {
            fontFamily: 'monospace',
            fontSize: '1.1rem'
          }
        }}
      />

      {showSymbolPad && (
        <Paper 
          elevation={3} 
          sx={{ 
            mt: 1, 
            p: 2, 
            maxHeight: 400, 
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Mathematical Symbols
          </Typography>

          {Object.entries(symbols).map(([category, categorySymbols]) => (
            <Box key={category} sx={{ mb: 2 }}>
              <Typography 
                variant="subtitle2" 
                color="primary" 
                sx={{ mb: 1, textTransform: 'capitalize' }}
              >
                {category}
              </Typography>
              
              <Grid container spacing={0.5}>
                {categorySymbols.map((item, index) => (
                  <Grid item key={index}>
                    <Tooltip title={item.label}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => insertSymbol(item.symbol)}
                        sx={{
                          minWidth: 40,
                          height: 40,
                          fontSize: '1.2rem',
                          fontFamily: 'serif'
                        }}
                      >
                        {item.symbol}
                      </Button>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
              
              {category !== 'brackets' && <Divider sx={{ mt: 1 }} />}
            </Box>
          ))}

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Click symbols to insert at cursor position
            </Typography>
            
            <ButtonGroup size="small">
              <Button onClick={() => setShowSymbolPad(false)}>
                Close
              </Button>
            </ButtonGroup>
          </Box>
        </Paper>
      )}

      {/* Preview of rendered math (if you want to add MathJax or KaTeX later) */}
      {value && (
        <Paper 
          variant="outlined" 
          sx={{ 
            mt: 1, 
            p: 2, 
            bgcolor: 'grey.50',
            fontFamily: 'serif',
            fontSize: '1.1rem'
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block">
            Preview:
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontFamily: 'serif',
              fontSize: '1.2rem',
              mt: 0.5
            }}
          >
            {value}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MathInput;