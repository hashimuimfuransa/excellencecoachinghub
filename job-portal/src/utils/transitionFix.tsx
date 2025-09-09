/**
 * Simple Fade transitions to avoid scrollTop errors
 * Using Fade instead of Slide eliminates scrollTop manipulation issues
 */

import React from 'react';
import { Fade } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';

// Simple Fade transition that works without scrollTop manipulation
export const SimpleFadeTransition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>((props, ref) => (
  <Fade ref={ref} {...props} timeout={300}>
    {props.children}
  </Fade>
));

SimpleFadeTransition.displayName = 'SimpleFadeTransition';

// Aliases for backward compatibility - all use Fade to avoid scrollTop issues
export const SafeSlideUp = SimpleFadeTransition;
export const SafeSlideDown = SimpleFadeTransition;
export const SafeSlideLeft = SimpleFadeTransition;
export const SafeSlideRight = SimpleFadeTransition;
export const SafeDialogTransition = SimpleFadeTransition;
export const SafeSlideTransition = SimpleFadeTransition;
export const SafeGrowTransition = SimpleFadeTransition;
export const SafeFadeTransition = SimpleFadeTransition;
export const SafeZoomTransition = SimpleFadeTransition;
export const SafeCollapseTransition = SimpleFadeTransition;

// Default export
export default SimpleFadeTransition;