import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StructuredNotesViewer from './StructuredNotesViewer';
import { StructuredNotes } from '../../services/documentProcessorService';

// Mock structured notes data
const mockStructuredNotes: StructuredNotes = {
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
    },
    {
      title: 'Conclusion Section',
      content: 'This is the conclusion section that summarizes the key takeaways and provides final thoughts.',
      keyPoints: [
        'Conclusion key point 1',
        'Conclusion key point 2'
      ]
    }
  ],
  metadata: {
    totalSections: 3,
    estimatedReadingTime: 5,
    difficulty: 'intermediate',
    topics: ['Testing', 'React', 'Structured Notes']
  }
};

// Mock material data
const mockMaterial = {
  _id: 'test-material-id',
  title: 'Test Material',
  type: 'structured_notes',
  content: {
    structuredNotes: mockStructuredNotes
  }
};

describe('StructuredNotesViewer', () => {
  it('renders structured notes content correctly', async () => {
    render(
      <StructuredNotesViewer
        material={mockMaterial}
        title="Test Material"
        height="500px"
      />
    );

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Test Structured Notes')).toBeInTheDocument();
    });

    // Check if summary is displayed
    expect(screen.getByText('This is a test summary of the structured notes content.')).toBeInTheDocument();

    // Check if key points are displayed
    expect(screen.getByText('First key point about the topic')).toBeInTheDocument();
    expect(screen.getByText('Second important concept to remember')).toBeInTheDocument();

    // Check if sections are displayed
    expect(screen.getByText('Introduction Section')).toBeInTheDocument();
    expect(screen.getByText('Main Content Section')).toBeInTheDocument();
    expect(screen.getByText('Conclusion Section')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    render(
      <StructuredNotesViewer
        material={mockMaterial}
        title="Test Material"
        height="500px"
      />
    );

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Test Structured Notes')).toBeInTheDocument();
    });

    // Find search input
    const searchInput = screen.getByPlaceholderText('Search in notes...');
    
    // Type in search query
    fireEvent.change(searchInput, { target: { value: 'Introduction' } });

    // Check if filtered results are shown
    await waitFor(() => {
      expect(screen.getByText('Introduction Section')).toBeInTheDocument();
      expect(screen.queryByText('Main Content Section')).not.toBeInTheDocument();
    });
  });

  it('handles bookmark functionality', async () => {
    render(
      <StructuredNotesViewer
        material={mockMaterial}
        title="Test Material"
        height="500px"
      />
    );

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Test Structured Notes')).toBeInTheDocument();
    });

    // Find bookmark button
    const bookmarkButton = screen.getByRole('button', { name: /bookmark/i });
    
    // Click bookmark button
    fireEvent.click(bookmarkButton);

    // Check if bookmark state changes (this would depend on the actual implementation)
    // The exact assertion would depend on how the bookmark state is visually represented
  });

  it('handles section expansion and reading progress', async () => {
    const onTimeSpent = jest.fn();
    const onComplete = jest.fn();

    render(
      <StructuredNotesViewer
        material={mockMaterial}
        title="Test Material"
        height="500px"
        onTimeSpent={onTimeSpent}
        onComplete={onComplete}
        showProgress={true}
      />
    );

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Test Structured Notes')).toBeInTheDocument();
    });

    // Check if progress bar is displayed
    expect(screen.getByText('Reading Progress')).toBeInTheDocument();
    expect(screen.getByText('0/3 sections')).toBeInTheDocument();

    // Find and click on a section to expand it
    const introductionSection = screen.getByText('Introduction Section');
    fireEvent.click(introductionSection);

    // Check if section content is displayed
    await waitFor(() => {
      expect(screen.getByText('This is the introduction content that explains the basic concepts and provides an overview of the topic.')).toBeInTheDocument();
    });
  });

  it('handles error state gracefully', async () => {
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

    // Wait for error state to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to Load Structured Notes')).toBeInTheDocument();
    });

    // Check if retry button is available
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(
      <StructuredNotesViewer
        material={null}
        title="Loading Material"
        height="500px"
      />
    );

    // Check if loading indicator is displayed
    expect(screen.getByText('Processing structured notes...')).toBeInTheDocument();
  });
});

// Integration test for the complete flow
describe('StructuredNotesViewer Integration', () => {
  it('completes the full reading flow', async () => {
    const onComplete = jest.fn();

    render(
      <StructuredNotesViewer
        material={mockMaterial}
        title="Test Material"
        height="500px"
        onComplete={onComplete}
        showProgress={true}
      />
    );

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Test Structured Notes')).toBeInTheDocument();
    });

    // Expand all sections to mark them as read
    const sections = ['Introduction Section', 'Main Content Section', 'Conclusion Section'];
    
    for (const sectionTitle of sections) {
      const section = screen.getByText(sectionTitle);
      fireEvent.click(section);
      
      // Wait for section to expand
      await waitFor(() => {
        expect(section.closest('.MuiAccordion-root')).toHaveAttribute('aria-expanded', 'true');
      });
    }

    // Check if all sections are marked as read
    await waitFor(() => {
      expect(screen.getByText('3/3 sections')).toBeInTheDocument();
    });

    // The onComplete callback should be called when all sections are read
    // This would depend on the actual implementation logic
  });
});
