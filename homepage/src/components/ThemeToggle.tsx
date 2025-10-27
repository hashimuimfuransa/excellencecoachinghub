import React from 'react';
import { IconButton, Tooltip, Zoom } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useThemeContext } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  sx?: any;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ size = 'medium', sx = {} }) => {
  const { isDarkMode, toggleTheme } = useThemeContext();

  return (
    <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} arrow>
      <Zoom in timeout={300}>
        <IconButton
          component={motion.button}
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          size={size}
          sx={{
            background: isDarkMode 
              ? 'linear-gradient(45deg, #ffd700, #ffed4e)' 
              : 'linear-gradient(45deg, #2d3748, #4a5568)',
            color: isDarkMode ? '#000' : '#fff',
            boxShadow: isDarkMode 
              ? '0 4px 15px rgba(255, 215, 0, 0.3)'
              : '0 4px 15px rgba(45, 55, 72, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: isDarkMode 
                ? 'linear-gradient(45deg, #ffed4e, #ffd700)' 
                : 'linear-gradient(45deg, #4a5568, #2d3748)',
              boxShadow: isDarkMode 
                ? '0 6px 20px rgba(255, 215, 0, 0.4)'
                : '0 6px 20px rgba(45, 55, 72, 0.4)',
            },
            ...sx,
          }}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDarkMode ? 180 : 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {isDarkMode ? (
              <LightMode sx={{ fontSize: size === 'small' ? 16 : size === 'large' ? 28 : 20 }} />
            ) : (
              <DarkMode sx={{ fontSize: size === 'small' ? 16 : size === 'large' ? 28 : 20 }} />
            )}
          </motion.div>
        </IconButton>
      </Zoom>
    </Tooltip>
  );
};

export default ThemeToggle;