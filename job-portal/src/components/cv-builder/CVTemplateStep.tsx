import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Stack,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Palette,
  CheckCircle,
  Preview,
  Style,
  Business,
  School,
  Code,
  Brush,
} from '@mui/icons-material';
import { CVTemplate, CVData } from '../../services/cvBuilderService';

interface CVTemplateStepProps {
  templates: CVTemplate[];
  selectedTemplate: CVTemplate | null;
  onTemplateSelect: (template: CVTemplate) => void;
  cvData: CVData;
}

const CVTemplateStep: React.FC<CVTemplateStepProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  cvData,
}) => {
  const [filterStyle, setFilterStyle] = React.useState<string>('all');
  const [filterColor, setFilterColor] = React.useState<string>('all');

  const filteredTemplates = templates.filter(template => {
    const styleMatch = filterStyle === 'all' || template.style === filterStyle;
    const colorMatch = filterColor === 'all' || template.color === filterColor;
    return styleMatch && colorMatch;
  });

  const getStyleIcon = (style: CVTemplate['style']) => {
    switch (style) {
      case 'modern': return <Style />;
      case 'classic': return <Business />;
      case 'creative': return <Brush />;
      case 'minimal': return <Code />;
      default: return <Style />;
    }
  };

  const getStyleColor = (style: CVTemplate['style']) => {
    switch (style) {
      case 'modern': return 'primary';
      case 'classic': return 'secondary';
      case 'creative': return 'error';
      case 'minimal': return 'success';
      default: return 'primary';
    }
  };

  const mockTemplates = [
    {
      id: 'modern-1',
      name: 'Modern Professional',
      description: 'Clean and contemporary design with bold typography',
      style: 'modern' as const,
      color: 'blue',
      preview: '/template-previews/modern-1.jpg',
    },
    {
      id: 'classic-1',
      name: 'Classic Executive',
      description: 'Traditional professional layout perfect for corporate roles',
      style: 'classic' as const,
      color: 'gray',
      preview: '/template-previews/classic-1.jpg',
    },
    {
      id: 'creative-1',
      name: 'Creative Designer',
      description: 'Eye-catching design for creative professionals',
      style: 'creative' as const,
      color: 'purple',
      preview: '/template-previews/creative-1.jpg',
    },
    {
      id: 'minimal-1',
      name: 'Minimal Tech',
      description: 'Clean and simple design focusing on content',
      style: 'minimal' as const,
      color: 'green',
      preview: '/template-previews/minimal-1.jpg',
    },
    {
      id: 'modern-2',
      name: 'Modern Sales',
      description: 'Dynamic design perfect for sales and marketing roles',
      style: 'modern' as const,
      color: 'orange',
      preview: '/template-previews/modern-2.jpg',
    },
    {
      id: 'classic-2',
      name: 'Classic Academic',
      description: 'Traditional format ideal for academic and research positions',
      style: 'classic' as const,
      color: 'navy',
      preview: '/template-previews/classic-2.jpg',
    },
  ];

  const allTemplates = templates.length > 0 ? templates : mockTemplates;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Palette sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">Choose Your CV Template</Typography>
      </Box>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Style</InputLabel>
              <Select
                value={filterStyle}
                label="Style"
                onChange={(e) => setFilterStyle(e.target.value)}
              >
                <MenuItem value="all">All Styles</MenuItem>
                <MenuItem value="modern">Modern</MenuItem>
                <MenuItem value="classic">Classic</MenuItem>
                <MenuItem value="creative">Creative</MenuItem>
                <MenuItem value="minimal">Minimal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Color</InputLabel>
              <Select
                value={filterColor}
                label="Color"
                onChange={(e) => setFilterColor(e.target.value)}
              >
                <MenuItem value="all">All Colors</MenuItem>
                <MenuItem value="blue">Blue</MenuItem>
                <MenuItem value="gray">Gray</MenuItem>
                <MenuItem value="purple">Purple</MenuItem>
                <MenuItem value="green">Green</MenuItem>
                <MenuItem value="orange">Orange</MenuItem>
                <MenuItem value="navy">Navy</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="textSecondary">
              {filteredTemplates.length} templates available
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Templates Grid */}
      <Grid container spacing={3}>
        {allTemplates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card 
              elevation={selectedTemplate?.id === template.id ? 4 : 1}
              sx={{
                height: '100%',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease-in-out',
                border: selectedTemplate?.id === template.id ? 2 : 0,
                borderColor: 'primary.main',
                '&:hover': {
                  elevation: 3,
                  transform: 'translateY(-2px)',
                }
              }}
              onClick={() => onTemplateSelect(template)}
            >
              {/* Preview Image */}
              <Box position="relative">
                <CardMedia
                  component="div"
                  sx={{
                    height: 200,
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    backgroundImage: `linear-gradient(135deg, ${template.color === 'blue' ? '#1976d2' : 
                                                                   template.color === 'gray' ? '#757575' :
                                                                   template.color === 'purple' ? '#9c27b0' :
                                                                   template.color === 'green' ? '#388e3c' :
                                                                   template.color === 'orange' ? '#f57c00' :
                                                                   template.color === 'navy' ? '#1a237e' : '#1976d2'}, ${template.color === 'blue' ? '#42a5f5' : 
                                                                   template.color === 'gray' ? '#bdbdbd' :
                                                                   template.color === 'purple' ? '#ce93d8' :
                                                                   template.color === 'green' ? '#81c784' :
                                                                   template.color === 'orange' ? '#ffb74d' :
                                                                   template.color === 'navy' ? '#5c6bc0' : '#42a5f5'})`,
                  }}
                >
                  {/* Mock CV Layout */}
                  <Box
                    sx={{
                      width: '80%',
                      height: '80%',
                      bgcolor: 'white',
                      borderRadius: 1,
                      p: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                    }}
                  >
                    <Box sx={{ height: 8, bgcolor: template.color === 'blue' ? '#1976d2' : 
                                                    template.color === 'gray' ? '#757575' :
                                                    template.color === 'purple' ? '#9c27b0' :
                                                    template.color === 'green' ? '#388e3c' :
                                                    template.color === 'orange' ? '#f57c00' :
                                                    template.color === 'navy' ? '#1a237e' : '#1976d2', borderRadius: 0.5 }} />
                    <Box sx={{ height: 4, bgcolor: 'grey.300', borderRadius: 0.5, width: '60%' }} />
                    <Box sx={{ height: 2, bgcolor: 'grey.200', borderRadius: 0.5, width: '80%' }} />
                    <Box sx={{ height: 2, bgcolor: 'grey.200', borderRadius: 0.5, width: '70%' }} />
                    <Box sx={{ height: 6, bgcolor: 'grey.300', borderRadius: 0.5, width: '50%', mt: 0.5 }} />
                    <Box sx={{ height: 2, bgcolor: 'grey.200', borderRadius: 0.5, width: '90%' }} />
                    <Box sx={{ height: 2, bgcolor: 'grey.200', borderRadius: 0.5, width: '85%' }} />
                    <Box sx={{ height: 2, bgcolor: 'grey.200', borderRadius: 0.5, width: '75%' }} />
                  </Box>
                  
                  {/* Selection Indicator */}
                  {selectedTemplate?.id === template.id && (
                    <Box
                      position="absolute"
                      top={8}
                      right={8}
                      sx={{
                        bgcolor: 'success.main',
                        borderRadius: '50%',
                        p: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle sx={{ color: 'white', fontSize: 16 }} />
                    </Box>
                  )}
                </CardMedia>
              </Box>

              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {template.name}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>
                
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <Chip
                    icon={getStyleIcon(template.style)}
                    label={template.style.charAt(0).toUpperCase() + template.style.slice(1)}
                    size="small"
                    color={getStyleColor(template.style)}
                    variant="outlined"
                  />
                  <Chip
                    label={template.color.charAt(0).toUpperCase() + template.color.slice(1)}
                    size="small"
                    sx={{
                      bgcolor: template.color === 'blue' ? '#e3f2fd' : 
                               template.color === 'gray' ? '#f5f5f5' :
                               template.color === 'purple' ? '#f3e5f5' :
                               template.color === 'green' ? '#e8f5e8' :
                               template.color === 'orange' ? '#fff3e0' :
                               template.color === 'navy' ? '#e8eaf6' : '#e3f2fd',
                      color: template.color === 'blue' ? '#1976d2' : 
                             template.color === 'gray' ? '#757575' :
                             template.color === 'purple' ? '#9c27b0' :
                             template.color === 'green' ? '#388e3c' :
                             template.color === 'orange' ? '#f57c00' :
                             template.color === 'navy' ? '#1a237e' : '#1976d2',
                    }}
                  />
                </Stack>
                
                <Button
                  variant={selectedTemplate?.id === template.id ? "contained" : "outlined"}
                  fullWidth
                  startIcon={selectedTemplate?.id === template.id ? <CheckCircle /> : <Preview />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTemplateSelect(template);
                  }}
                >
                  {selectedTemplate?.id === template.id ? 'Selected' : 'Select Template'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Template Recommendations */}
      {cvData.experiences.length > 0 && (
        <Paper elevation={1} sx={{ mt: 4, p: 3, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom color="primary">
            💡 Template Recommendations
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>
                <strong>For Corporate/Executive Roles:</strong> Choose Classic templates for traditional industries like finance, law, or consulting.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>
                <strong>For Tech/Startup Roles:</strong> Modern or Minimal templates work well for technology and startup companies.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>
                <strong>For Creative Roles:</strong> Creative templates are perfect for design, marketing, and artistic positions.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>
                <strong>For Academic Roles:</strong> Classic templates with plenty of space for publications and research work.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default CVTemplateStep;