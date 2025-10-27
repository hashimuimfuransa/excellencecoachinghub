import React from 'react';
import type { TransitionProps } from '@mui/material/transitions';

// Safe transition component that prevents "Cannot read properties of undefined (reading 'style')" errors
// This component simply renders children without any transition effects to avoid ref/style issues
export const SimpleFadeTransition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>((props, ref) => {
  const { children, in: inProp, ...other } = props;
  
  // Simply return the children wrapped in a div that can accept the ref
  // No transition effects to avoid the undefined style error
  return (
    <div ref={ref as any} {...other}>
      {inProp ? children : null}
    </div>
  );
});

SimpleFadeTransition.displayName = 'SimpleFadeTransition';

// Safe replacements for problematic slide transitions
export const SafeSlideUp = SimpleFadeTransition;
export const SafeSlideDown = SimpleFadeTransition;
export const SafeSlideLeft = SimpleFadeTransition;
export const SafeSlideRight = SimpleFadeTransition;
export const SafeDialogTransition = SimpleFadeTransition;
export const SafeSlideTransition = SimpleFadeTransition;