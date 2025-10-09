# Universal Material Viewer

A comprehensive document viewer component that supports multiple file formats using PDFTron WebViewer.

## Supported Formats

### PDF Documents
- Full PDF viewing with zoom, rotation, and navigation
- Annotation support (if license key provided)
- Search functionality
- Print capabilities

### Office Documents
- Word documents (.doc, .docx)
- PowerPoint presentations (.ppt, .pptx)
- Excel spreadsheets (.xls, .xlsx)
- Full editing capabilities (if license key provided)

### Media Files
- Video files (.mp4, .avi, .mov, .wmv, .flv, .webm)
- Audio files (.mp3, .wav, .ogg)
- Built-in media controls
- Fullscreen support

### Images
- Common image formats (.jpg, .jpeg, .png, .gif, .bmp, .svg, .webp)
- Zoom in/out functionality
- Download option
- Responsive display

## Usage

```tsx
import { UniversalMaterialViewer } from './components/UniversalMaterialViewer';

<UniversalMaterialViewer
  url="https://example.com/document.pdf"
  title="Course Material"
  type="document"
  height="70vh"
/>
```

## Props

- `url`: The URL of the material to display
- `title`: The title of the material
- `type`: The type of material (document, video, audio, etc.)
- `height`: The height of the viewer (default: "70vh")

## Features

- Automatic format detection
- Fallback to download/open in new tab for unsupported formats
- Loading states and error handling
- Responsive design
- Mobile-friendly interface

## License

To use PDFTron WebViewer with full features, you need to obtain a license key from PDFTron and add it to the WebViewer configuration.

