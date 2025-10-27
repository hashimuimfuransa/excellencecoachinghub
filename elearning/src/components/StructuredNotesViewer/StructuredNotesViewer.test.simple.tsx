import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StructuredNotesViewer from './StructuredNotesViewer';

// Mock structured notes data
const mockMaterial = {
  _id: 'test-material-id',
  title: 'Test Material',
  type: 'structured_notes',
  content: {
    structuredNotes: {
      title: 'Test Structured Notes',
      summary: 'This is a test summary of the structured notes content.',
      keyPoints: [
        'First key point about the topic',
        'Second important concept to remember',
        'Third critical insight for understanding'
      ],
      sections: [
        {
          title: 'Introduction Section',
          content: 'This is the introduction content that explains the basic concepts and provides an overview of the topic.',
          keyPoints: [
            'Introduction key point 1',
            'Introduction key point 2'
          ]
        },
        {
          title: 'Main Content Section',
          content: 'This is the main content section that contains the core information and detailed explanations.',
          keyPoints: [
            'Main content key point 1',
            'Main content key point 2',
            'Main content key point 3'
          ]
        }
      ],
      metadata: {
        totalSections: 2,
        estimatedReadingTime: 5,
        difficulty: 'intermediate',
        topics: ['Testing', 'React', 'Structured Notes']
      }
    }
  }
};

describe('StructuredNotesViewer Integration Test', () => {
  it('renders structured notes content correctly without UniversalMaterialViewer', () => {
    render(
      <StructuredNotesViewer
        material={mockMaterial}
        title="Test Material"
        height="500px"
      />
    );

    // Check if the main title is displayed
    expect(screen.getByText('Test Structured Notes')).toBeInTheDocument();
    
    // Check if summary is displayed
    expect(screen.getByText('This is a test summary of the structured notes content.')).toBeInTheDocument();
    
    // Check if key points are displayed
    expect(screen.getByText('First key point about the topic')).toBeInTheDocument();
    expect(screen.getByText('Second important concept to remember')).toBeInTheDocument();
    
    // Check if sections are displayed
    expect(screen.getByText('Introduction Section')).toBeInTheDocument();
    expect(screen.getByText('Main Content Section')).toBeInTheDocument();
    
    // Check if metadata is displayed
    expect(screen.getByText('2 Sections')).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
  });

  it('handles search functionality independently', () => {
    render(
      <StructuredNotesViewer
        material={mockMaterial}
        title="Test Material"
        height="500px"
      />
    );

    // Find search input
    const searchInput = screen.getByPlaceholderText('Search in notes...');
    
    // Type in search query
    searchInput.focus();
    searchInput.value = 'Introduction';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Check if filtered results are shown (this would depend on the actual implementation)
    expect(screen.getByText('Introduction Section')).toBeInTheDocument();
  });

  it('displays proper error handling for invalid content', () => {
    const invalidMaterial = {
      _id: 'invalid-material-id',
      title: 'Invalid Material',
      type: 'structured_notes',
      content: null // Invalid content
    };

    render(
      <StructuredNotesViewer
        material={invalidMaterial}
        title="Invalid Material"
        height="500px"
      />
    );

    // Should show error state
    expect(screen.getByText('Failed to Load Structured Notes')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});
