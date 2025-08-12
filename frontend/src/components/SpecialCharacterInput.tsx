import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  Paper,
  Grid,
  Button,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Functions,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Clear
} from '@mui/icons-material';

interface SpecialCharacterInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

// Character categories
const characterCategories = {
  greek: {
    label: 'Greek Letters',
    characters: [
      { symbol: 'α', name: 'alpha' },
      { symbol: 'β', name: 'beta' },
      { symbol: 'γ', name: 'gamma' },
      { symbol: 'δ', name: 'delta' },
      { symbol: 'ε', name: 'epsilon' },
      { symbol: 'ζ', name: 'zeta' },
      { symbol: 'η', name: 'eta' },
      { symbol: 'θ', name: 'theta' },
      { symbol: 'ι', name: 'iota' },
      { symbol: 'κ', name: 'kappa' },
      { symbol: 'λ', name: 'lambda' },
      { symbol: 'μ', name: 'mu' },
      { symbol: 'ν', name: 'nu' },
      { symbol: 'ξ', name: 'xi' },
      { symbol: 'π', name: 'pi' },
      { symbol: 'ρ', name: 'rho' },
      { symbol: 'σ', name: 'sigma' },
      { symbol: 'τ', name: 'tau' },
      { symbol: 'υ', name: 'upsilon' },
      { symbol: 'φ', name: 'phi' },
      { symbol: 'χ', name: 'chi' },
      { symbol: 'ψ', name: 'psi' },
      { symbol: 'ω', name: 'omega' },
      { symbol: 'Α', name: 'Alpha' },
      { symbol: 'Β', name: 'Beta' },
      { symbol: 'Γ', name: 'Gamma' },
      { symbol: 'Δ', name: 'Delta' },
      { symbol: 'Θ', name: 'Theta' },
      { symbol: 'Λ', name: 'Lambda' },
      { symbol: 'Π', name: 'Pi' },
      { symbol: 'Σ', name: 'Sigma' },
      { symbol: 'Φ', name: 'Phi' },
      { symbol: 'Ω', name: 'Omega' }
    ]
  },
  math: {
    label: 'Math Symbols',
    characters: [
      { symbol: '±', name: 'plus-minus' },
      { symbol: '∓', name: 'minus-plus' },
      { symbol: '×', name: 'multiply' },
      { symbol: '÷', name: 'divide' },
      { symbol: '=', name: 'equals' },
      { symbol: '≠', name: 'not equal' },
      { symbol: '≈', name: 'approximately' },
      { symbol: '≡', name: 'identical' },
      { symbol: '<', name: 'less than' },
      { symbol: '>', name: 'greater than' },
      { symbol: '≤', name: 'less than or equal' },
      { symbol: '≥', name: 'greater than or equal' },
      { symbol: '∞', name: 'infinity' },
      { symbol: '∑', name: 'sum' },
      { symbol: '∏', name: 'product' },
      { symbol: '∫', name: 'integral' },
      { symbol: '∂', name: 'partial derivative' },
      { symbol: '∇', name: 'nabla' },
      { symbol: '√', name: 'square root' },
      { symbol: '∛', name: 'cube root' },
      { symbol: '∜', name: 'fourth root' },
      { symbol: '^', name: 'superscript' },
      { symbol: '₀', name: 'subscript 0' },
      { symbol: '₁', name: 'subscript 1' },
      { symbol: '₂', name: 'subscript 2' },
      { symbol: '₃', name: 'subscript 3' },
      { symbol: '₄', name: 'subscript 4' },
      { symbol: '₅', name: 'subscript 5' },
      { symbol: '₆', name: 'subscript 6' },
      { symbol: '₇', name: 'subscript 7' },
      { symbol: '₈', name: 'subscript 8' },
      { symbol: '₉', name: 'subscript 9' }
    ]
  },
  fractions: {
    label: 'Fractions',
    characters: [
      { symbol: '½', name: 'one half' },
      { symbol: '⅓', name: 'one third' },
      { symbol: '⅔', name: 'two thirds' },
      { symbol: '¼', name: 'one quarter' },
      { symbol: '¾', name: 'three quarters' },
      { symbol: '⅕', name: 'one fifth' },
      { symbol: '⅖', name: 'two fifths' },
      { symbol: '⅗', name: 'three fifths' },
      { symbol: '⅘', name: 'four fifths' },
      { symbol: '⅙', name: 'one sixth' },
      { symbol: '⅚', name: 'five sixths' },
      { symbol: '⅛', name: 'one eighth' },
      { symbol: '⅜', name: 'three eighths' },
      { symbol: '⅝', name: 'five eighths' },
      { symbol: '⅞', name: 'seven eighths' }
    ]
  },
  geometry: {
    label: 'Geometry',
    characters: [
      { symbol: '°', name: 'degree' },
      { symbol: '∠', name: 'angle' },
      { symbol: '⊥', name: 'perpendicular' },
      { symbol: '∥', name: 'parallel' },
      { symbol: '△', name: 'triangle' },
      { symbol: '□', name: 'square' },
      { symbol: '○', name: 'circle' },
      { symbol: '⊙', name: 'circle with dot' },
      { symbol: '⌒', name: 'arc' },
      { symbol: '∴', name: 'therefore' },
      { symbol: '∵', name: 'because' },
      { symbol: '≅', name: 'congruent' },
      { symbol: '∼', name: 'similar' },
      { symbol: '⊂', name: 'subset' },
      { symbol: '⊃', name: 'superset' },
      { symbol: '∈', name: 'element of' },
      { symbol: '∉', name: 'not element of' },
      { symbol: '∪', name: 'union' },
      { symbol: '∩', name: 'intersection' }
    ]
  },
  arrows: {
    label: 'Arrows',
    characters: [
      { symbol: '→', name: 'right arrow' },
      { symbol: '←', name: 'left arrow' },
      { symbol: '↑', name: 'up arrow' },
      { symbol: '↓', name: 'down arrow' },
      { symbol: '↔', name: 'left right arrow' },
      { symbol: '↕', name: 'up down arrow' },
      { symbol: '⇒', name: 'double right arrow' },
      { symbol: '⇐', name: 'double left arrow' },
      { symbol: '⇔', name: 'double left right arrow' },
      { symbol: '↗', name: 'up right arrow' },
      { symbol: '↖', name: 'up left arrow' },
      { symbol: '↘', name: 'down right arrow' },
      { symbol: '↙', name: 'down left arrow' }
    ]
  }
};

const SpecialCharacterInput: React.FC<SpecialCharacterInputProps> = ({
  value,
  onChange,
  label = 'Answer',
  placeholder = 'Enter your answer...',
  multiline = false,
  rows = 1,
  disabled = false,
  error = false,
  helperText
}) => {
  const [showCharacterPalette, setShowCharacterPalette] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const textFieldRef = useRef<HTMLInputElement>(null);

  const handleCharacterClick = (character: string) => {
    if (textFieldRef.current) {
      const input = textFieldRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      
      const newValue = value.slice(0, start) + character + value.slice(end);
      onChange(newValue);
      
      // Set cursor position after the inserted character
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + character.length, start + character.length);
      }, 0);
    }
  };

  const handleClear = () => {
    onChange('');
    if (textFieldRef.current) {
      textFieldRef.current.focus();
    }
  };

  const tabCategories = Object.keys(characterCategories);

  return (
    <Box>
      <TextField
        inputRef={textFieldRef}
        fullWidth
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        multiline={multiline}
        rows={rows}
        disabled={disabled}
        error={error}
        helperText={helperText}
        InputProps={{
          endAdornment: (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {value && (
                <Tooltip title="Clear">
                  <IconButton size="small" onClick={handleClear}>
                    <Clear fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Special Characters">
                <IconButton
                  size="small"
                  onClick={() => setShowCharacterPalette(!showCharacterPalette)}
                  color={showCharacterPalette ? 'primary' : 'default'}
                >
                  <Functions fontSize="small" />
                  {showCharacterPalette ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                </IconButton>
              </Tooltip>
            </Box>
          )
        }}
      />

      <Collapse in={showCharacterPalette}>
        <Paper sx={{ mt: 1, p: 2, border: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            Special Characters
          </Typography>
          
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2, minHeight: 'auto' }}
          >
            {tabCategories.map((category, index) => (
              <Tab
                key={category}
                label={characterCategories[category as keyof typeof characterCategories].label}
                sx={{ minHeight: 'auto', py: 1 }}
              />
            ))}
          </Tabs>

          <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
            <Grid container spacing={0.5}>
              {characterCategories[tabCategories[selectedTab] as keyof typeof characterCategories].characters.map((char, index) => (
                <Grid item key={index}>
                  <Tooltip title={char.name}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleCharacterClick(char.symbol)}
                      sx={{
                        minWidth: 40,
                        height: 40,
                        fontSize: '1.2rem',
                        fontFamily: 'serif',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          color: 'white'
                        }
                      }}
                    >
                      {char.symbol}
                    </Button>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Click on any symbol to insert it at cursor position
            </Typography>
            <Button
              size="small"
              onClick={() => setShowCharacterPalette(false)}
            >
              Close
            </Button>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default SpecialCharacterInput;
