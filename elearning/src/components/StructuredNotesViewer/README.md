# Structured Notes Viewer

An independent, feature-rich component for viewing structured notes with advanced functionality including search, bookmarks, progress tracking, and user annotations.

## Overview

The Structured Notes Viewer is designed to be completely independent of the Universal Material Viewer, providing its own robust data processing, validation, and error handling capabilities.

## Components

### 1. StructuredNotesViewer (Main Component)
The primary component that most applications should use. It includes automatic data processing and validation.

```tsx
import { StructuredNotesViewer } from '../../components/StructuredNotesViewer';

<StructuredNotesViewer
  material={material}
  content={content}
  title="My Notes"
  height="70vh"
  onTimeSpent={(time) => console.log('Time spent:', time)}
  onComplete={() => console.log('Reading completed')}
  showProgress={true}
  userId="user123"
/>
```

### 2. IndependentStructuredNotesViewer
The core viewer component without data processing. Use this when you have already validated and processed the structured notes data.

```tsx
import { IndependentStructuredNotesViewer } from '../../components/StructuredNotesViewer';

<IndependentStructuredNotesViewer
  structuredNotes={processedNotes}
  title="My Notes"
  height="70vh"
  onTimeSpent={(time) => console.log('Time spent:', time)}
  onComplete={() => console.log('Reading completed')}
  showProgress={true}
  userId="user123"
/>
```

### 3. StructuredNotesWrapper
A wrapper component that handles data processing, validation, and error handling. Used internally by the main StructuredNotesViewer.

## Features

### Core Features
- **Structured Content Display**: Organized sections with titles, content, and key points
- **Progress Tracking**: Visual progress indicators and completion tracking
- **Time Tracking**: Automatic time spent calculation
- **Search Functionality**: Full-text search across all content
- **Bookmarking**: Save and manage bookmarks
- **User Notes**: Add personal annotations to sections

### Advanced Features
- **Responsive Design**: Works on all screen sizes
- **Fullscreen Mode**: Distraction-free reading experience
- **Print Support**: Optimized printing with custom styles
- **Export Functionality**: Download notes as text files
- **Share Integration**: Native sharing API support
- **Accessibility**: Full keyboard navigation and screen reader support

### Data Processing
- **Automatic Validation**: Validates structured notes format
- **Multiple Data Sources**: Supports various content structures
- **Error Handling**: Graceful error states with retry functionality
- **Loading States**: Smooth loading experiences

## Props

### StructuredNotesViewer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `material` | `any` | - | Material object containing structured notes |
| `content` | `any` | - | Direct content object |
| `title` | `string` | - | Display title for the notes |
| `height` | `string` | `'70vh'` | Container height |
| `onTimeSpent` | `(time: number) => void` | - | Callback for time tracking |
| `onComplete` | `() => void` | - | Callback when reading is completed |
| `showProgress` | `boolean` | `false` | Show progress indicators |
| `userId` | `string` | - | User ID for personalization |
| `autoRetry` | `boolean` | `true` | Enable automatic retry on errors |
| `maxRetries` | `number` | `3` | Maximum retry attempts |
| `retryDelay` | `number` | `2000` | Delay between retries (ms) |
| `validateContent` | `boolean` | `true` | Enable content validation |

### IndependentStructuredNotesViewer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `structuredNotes` | `StructuredNotes` | - | Processed structured notes data |
| `content` | `any` | - | Alternative content source |
| `title` | `string` | - | Display title |
| `height` | `string` | `'70vh'` | Container height |
| `onTimeSpent` | `(time: number) => void` | - | Time tracking callback |
| `onComplete` | `() => void` | - | Completion callback |
| `showProgress` | `boolean` | `false` | Show progress |
| `userId` | `string` | - | User ID |
| `loading` | `boolean` | `false` | Loading state |
| `error` | `string \| null` | - | Error message |
| `onRetry` | `() => void` | - | Retry callback |

## Data Structure

The component expects structured notes in the following format:

```typescript
interface StructuredNotes {
  title: string;
  summary: string;
  keyPoints: string[];
  sections: Array<{
    title: string;
    content: string;
    keyPoints: string[];
  }>;
  metadata: {
    totalSections: number;
    estimatedReadingTime: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    topics: string[];
  };
}
```

## Usage Examples

### Basic Usage
```tsx
import { StructuredNotesViewer } from '../../components/StructuredNotesViewer';

function MyComponent() {
  const material = {
    type: 'structured_notes',
    content: {
      structuredNotes: {
        title: 'My Notes',
        summary: 'Summary of the content',
        keyPoints: ['Point 1', 'Point 2'],
        sections: [
          {
            title: 'Section 1',
            content: 'Content of section 1',
            keyPoints: ['Section point 1']
          }
        ],
        metadata: {
          totalSections: 1,
          estimatedReadingTime: 5,
          difficulty: 'intermediate',
          topics: ['Topic 1']
        }
      }
    }
  };

  return (
    <StructuredNotesViewer
      material={material}
      title="My Notes"
      height="80vh"
      showProgress={true}
      onComplete={() => console.log('Completed!')}
    />
  );
}
```

### Advanced Usage with Error Handling
```tsx
import { StructuredNotesViewer } from '../../components/StructuredNotesViewer';

function AdvancedComponent() {
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleTimeSpent = (time: number) => {
    setTimeSpent(time);
    // Save to backend
    saveTimeSpent(time);
  };

  const handleComplete = () => {
    setIsCompleted(true);
    // Mark as completed in backend
    markAsCompleted();
  };

  return (
    <StructuredNotesViewer
      material={material}
      title="Advanced Notes"
      height="100vh"
      onTimeSpent={handleTimeSpent}
      onComplete={handleComplete}
      showProgress={true}
      userId={currentUser.id}
      autoRetry={true}
      maxRetries={5}
      validateContent={true}
    />
  );
}
```

## Styling

The component uses Material-UI theming and includes custom CSS classes:

- `.structured-notes-viewer` - Main container
- `.search-highlight` - Search result highlighting
- `.section-starred` - Starred sections
- `.section-read` - Read sections
- `.user-notes` - User annotation areas

## Accessibility

- Full keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Focus management
- ARIA labels and descriptions

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance

- Lazy loading of sections
- Efficient search with debouncing
- Optimized re-renders
- Memory leak prevention
- Responsive design with CSS Grid/Flexbox

## Migration from Universal Material Viewer

If you're migrating from the Universal Material Viewer, the new Structured Notes Viewer provides:

1. **Independent Operation**: No dependency on Universal Material Viewer
2. **Better Error Handling**: Robust error states and retry mechanisms
3. **Enhanced Features**: More advanced functionality out of the box
4. **Improved Performance**: Optimized for structured notes specifically
5. **Better TypeScript Support**: Full type safety and IntelliSense

### Migration Steps

1. Replace imports:
   ```tsx
   // Old
   import { UniversalMaterialViewer } from '../../components/UniversalMaterialViewer';
   
   // New
   import { StructuredNotesViewer } from '../../components/StructuredNotesViewer';
   ```

2. Update component usage:
   ```tsx
   // Old
   <UniversalMaterialViewer
     type="structured_notes"
     content={content}
     title={title}
   />
   
   // New
   <StructuredNotesViewer
     material={material}
     content={content}
     title={title}
   />
   ```

3. Update props as needed based on the new API.

## Testing

The component includes comprehensive tests covering:
- Rendering and display
- User interactions
- Error states
- Loading states
- Progress tracking
- Search functionality
- Bookmark management

Run tests with:
```bash
npm test -- StructuredNotesViewer
```

## Contributing

When contributing to this component:

1. Follow the existing code style and patterns
2. Add tests for new functionality
3. Update documentation
4. Ensure accessibility compliance
5. Test across different browsers and devices

## License

This component is part of the Excellence Coaching Hub project and follows the same licensing terms.
