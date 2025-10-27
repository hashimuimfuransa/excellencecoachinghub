/**
 * Main Structured Notes Viewer Component
 * 
 * This is the primary export for the structured notes viewer system.
 * It provides a unified interface for viewing structured notes with
 * automatic data processing, validation, and error handling.
 */

import React from 'react';
import StructuredNotesWrapper from './StructuredNotesWrapper';

// Re-export the wrapper as the main component for easy usage
export default StructuredNotesWrapper;

// Also export as named export for flexibility
export { default as StructuredNotesWrapper } from './StructuredNotesWrapper';
export { default as IndependentStructuredNotesViewer } from './IndependentStructuredNotesViewer';

// Export types
export type { StructuredNotes } from '../../services/documentProcessorService';
