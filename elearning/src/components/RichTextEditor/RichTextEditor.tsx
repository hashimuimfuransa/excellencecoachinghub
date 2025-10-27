import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Toolbar,
  IconButton,
  Divider,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
  ButtonGroup,
  Chip
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Link,
  Image,
  Undo,
  Redo,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  Subscript,
  Superscript,
  FormatColorText,
  FormatColorFill,
  Code,
  Functions
} from '@mui/icons-material';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  maxHeight?: number;
  showWordCount?: boolean;
  allowImages?: boolean;
  allowLinks?: boolean;
  allowMath?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing your answer...',
  disabled = false,
  minHeight = 200,
  maxHeight = 600,
  showWordCount = true,
  allowImages = false,
  allowLinks = true,
  allowMath = true
}) => {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  // Font families for academic writing
  const fontFamilies = [
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Times New Roman, serif', label: 'Times New Roman' },
    { value: 'Calibri, sans-serif', label: 'Calibri' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Courier New, monospace', label: 'Courier New' }
  ];

  // Font sizes
  const fontSizes = [
    { value: '10px', label: '10' },
    { value: '12px', label: '12' },
    { value: '14px', label: '14' },
    { value: '16px', label: '16' },
    { value: '18px', label: '18' },
    { value: '20px', label: '20' },
    { value: '24px', label: '24' }
  ];

  // Update word and character count
  useEffect(() => {
    const text = value.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    
    setWordCount(words);
    setCharCount(chars);
  }, [value]);

  // Execute formatting command
  const executeCommand = (command: string, value?: string) => {
    if (disabled) return;
    
    document.execCommand(command, false, value);
    updateContent();
  };

  // Update content from editor
  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  // Handle text selection
  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString());
    }
  };

  // Insert mathematical expression
  const insertMathExpression = () => {
    const expression = prompt('Enter mathematical expression:');
    if (expression) {
      // In a real implementation, you might use MathJax or KaTeX
      executeCommand('insertHTML', `<span class="math-expression" style="font-family: serif; font-style: italic; background: #f0f0f0; padding: 2px 4px; border-radius: 3px;">${expression}</span>`);
    }
  };

  // Insert link
  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  // Insert image
  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      executeCommand('insertImage', url);
    }
  };

  // Handle paste to clean up formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    executeCommand('insertText', text);
  };

  return (
    <Paper elevation={1} sx={{ border: '1px solid', borderColor: 'divider' }}>
      {/* Toolbar */}
      <Toolbar 
        variant="dense" 
        sx={{ 
          bgcolor: 'grey.50', 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          flexWrap: 'wrap',
          gap: 1,
          py: 1
        }}
      >
        {/* Font Family */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            defaultValue="Arial, sans-serif"
            onChange={(e) => executeCommand('fontName', e.target.value)}
            disabled={disabled}
          >
            {fontFamilies.map((font) => (
              <MenuItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.value }}>{font.label}</span>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Font Size */}
        <FormControl size="small" sx={{ minWidth: 60 }}>
          <Select
            defaultValue="14px"
            onChange={(e) => executeCommand('fontSize', e.target.value)}
            disabled={disabled}
          >
            {fontSizes.map((size) => (
              <MenuItem key={size.value} value={size.value}>
                {size.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider orientation="vertical" flexItem />

        {/* Basic Formatting */}
        <ButtonGroup size="small">
          <Tooltip title="Bold">
            <IconButton onClick={() => executeCommand('bold')} disabled={disabled}>
              <FormatBold />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic">
            <IconButton onClick={() => executeCommand('italic')} disabled={disabled}>
              <FormatItalic />
            </IconButton>
          </Tooltip>
          <Tooltip title="Underline">
            <IconButton onClick={() => executeCommand('underline')} disabled={disabled}>
              <FormatUnderlined />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Subscript/Superscript */}
        <ButtonGroup size="small">
          <Tooltip title="Subscript">
            <IconButton onClick={() => executeCommand('subscript')} disabled={disabled}>
              <Subscript />
            </IconButton>
          </Tooltip>
          <Tooltip title="Superscript">
            <IconButton onClick={() => executeCommand('superscript')} disabled={disabled}>
              <Superscript />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Lists */}
        <ButtonGroup size="small">
          <Tooltip title="Bullet List">
            <IconButton onClick={() => executeCommand('insertUnorderedList')} disabled={disabled}>
              <FormatListBulleted />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbered List">
            <IconButton onClick={() => executeCommand('insertOrderedList')} disabled={disabled}>
              <FormatListNumbered />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Alignment */}
        <ButtonGroup size="small">
          <Tooltip title="Align Left">
            <IconButton onClick={() => executeCommand('justifyLeft')} disabled={disabled}>
              <FormatAlignLeft />
            </IconButton>
          </Tooltip>
          <Tooltip title="Align Center">
            <IconButton onClick={() => executeCommand('justifyCenter')} disabled={disabled}>
              <FormatAlignCenter />
            </IconButton>
          </Tooltip>
          <Tooltip title="Align Right">
            <IconButton onClick={() => executeCommand('justifyRight')} disabled={disabled}>
              <FormatAlignRight />
            </IconButton>
          </Tooltip>
          <Tooltip title="Justify">
            <IconButton onClick={() => executeCommand('justifyFull')} disabled={disabled}>
              <FormatAlignJustify />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Special Features */}
        <ButtonGroup size="small">
          <Tooltip title="Quote">
            <IconButton onClick={() => executeCommand('formatBlock', 'blockquote')} disabled={disabled}>
              <FormatQuote />
            </IconButton>
          </Tooltip>
          <Tooltip title="Code">
            <IconButton onClick={() => executeCommand('formatBlock', 'pre')} disabled={disabled}>
              <Code />
            </IconButton>
          </Tooltip>
          {allowMath && (
            <Tooltip title="Math Expression">
              <IconButton onClick={insertMathExpression} disabled={disabled}>
                <Functions />
              </IconButton>
            </Tooltip>
          )}
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Insert */}
        <ButtonGroup size="small">
          {allowLinks && (
            <Tooltip title="Insert Link">
              <IconButton onClick={insertLink} disabled={disabled}>
                <Link />
              </IconButton>
            </Tooltip>
          )}
          {allowImages && (
            <Tooltip title="Insert Image">
              <IconButton onClick={insertImage} disabled={disabled}>
                <Image />
              </IconButton>
            </Tooltip>
          )}
        </ButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Undo/Redo */}
        <ButtonGroup size="small">
          <Tooltip title="Undo">
            <IconButton onClick={() => executeCommand('undo')} disabled={disabled}>
              <Undo />
            </IconButton>
          </Tooltip>
          <Tooltip title="Redo">
            <IconButton onClick={() => executeCommand('redo')} disabled={disabled}>
              <Redo />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Toolbar>

      {/* Editor */}
      <Box
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={updateContent}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        onPaste={handlePaste}
        sx={{
          minHeight,
          maxHeight,
          overflow: 'auto',
          p: 2,
          outline: 'none',
          fontSize: '14px',
          lineHeight: 1.6,
          fontFamily: 'Arial, sans-serif',
          '&:empty::before': {
            content: `"${placeholder}"`,
            color: 'text.secondary',
            fontStyle: 'italic'
          },
          '& blockquote': {
            borderLeft: '4px solid #ccc',
            margin: '1em 0',
            paddingLeft: '1em',
            fontStyle: 'italic'
          },
          '& pre': {
            backgroundColor: '#f5f5f5',
            padding: '1em',
            borderRadius: '4px',
            fontFamily: 'monospace',
            overflow: 'auto'
          },
          '& .math-expression': {
            fontFamily: 'serif',
            fontStyle: 'italic',
            backgroundColor: '#f0f0f0',
            padding: '2px 4px',
            borderRadius: '3px'
          }
        }}
        dangerouslySetInnerHTML={{ __html: value }}
      />

      {/* Status Bar */}
      {showWordCount && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            px: 2, 
            py: 1, 
            bgcolor: 'grey.50',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip 
              label={`${wordCount} words`} 
              size="small" 
              variant="outlined"
            />
            <Chip 
              label={`${charCount} characters`} 
              size="small" 
              variant="outlined"
            />
          </Box>
          
          {selectedText && (
            <Typography variant="caption" color="text.secondary">
              Selected: "{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}"
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default RichTextEditor;