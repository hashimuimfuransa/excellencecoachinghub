// Main structured notes viewer (recommended for most use cases)
export { default as StructuredNotesViewer } from './StructuredNotesWrapper';

// Individual components for advanced usage
export { default as IndependentStructuredNotesViewer } from './IndependentStructuredNotesViewer';
export { default as StructuredNotesWrapper } from './StructuredNotesWrapper';

// Note: Legacy StructuredNotesViewer from UniversalMaterialViewer has been removed
// Use the new StructuredNotesViewer components instead

// Export types
export type { StructuredNotes } from '../../services/documentProcessorService';

// Default export (main component)
export { default } from './StructuredNotesWrapper';
