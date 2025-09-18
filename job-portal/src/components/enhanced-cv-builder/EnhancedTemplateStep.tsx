import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  useTheme,
  useMediaQuery,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Palette,
  Visibility,
  CheckCircle,
  Close,
  FilterList,
  Business,
  Brush,
  Computer,
  AccountBalance,
} from '@mui/icons-material';
import { CVTemplate, CVData } from '../../services/cvBuilderService';

interface EnhancedTemplateStepProps {
  templates: CVTemplate[];
  selectedTemplate: CVTemplate | null;
  onTemplateSelect: (template: CVTemplate) => void;
  cvData: CVData;
}

const industryRecommendations = {
  'Technology': ['modern-1', 'minimal-1'],
  'Finance': ['classic-1', 'professional-1'],
  'Creative': ['creative-1', 'artistic-1'],
  'Healthcare': ['professional-1', 'clean-1'],
  'Education': ['academic-1', 'traditional-1'],
  'Marketing': ['creative-1', 'modern-1'],
};

const templateCategories = [
  { id: 'all', label: 'All Templates', icon: <Palette /> },
  { id: 'modern', label: 'Modern', icon: <Computer /> },
  { id: 'classic', label: 'Classic', icon: <AccountBalance /> },
  { id: 'creative', label: 'Creative', icon: <Brush /> },
  { id: 'professional', label: 'Professional', icon: <Business /> },
];

const EnhancedTemplateStep: React.FC<EnhancedTemplateStepProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  cvData,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CVTemplate | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('');

  const handlePreview = (template: CVTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const filteredTemplates = templates.filter((template) => {
    if (filterCategory !== 'all' && template.style !== filterCategory) {
      return false;
    }
    if (industryFilter && !industryRecommendations[industryFilter]?.includes(template.id)) {
      return false;
    }
    return true;
  });

  const getTemplateFeatures = (template: CVTemplate): string[] => {
    const features = [];
    
    if (template.style === 'modern') {
      features.push('Clean Layout', 'ATS Friendly', 'Professional Colors');
    } else if (template.style === 'creative') {
      features.push('Eye-catching Design', 'Visual Elements', 'Creative Layout');
    } else if (template.style === 'classic') {
      features.push('Traditional Format', 'Corporate Style', 'Conservative Design');
    } else if (template.style === 'minimal') {
      features.push('Minimal Design', 'Focus on Content', 'Clean Typography');
    }
    
    return features;
  };

  const getCompatibilityScore = (template: CVTemplate): number => {
    let score = 100;
    
    // Reduce score for creative templates if applying to conservative industries
    if (template.style === 'creative') {
      score -= 10;
    }
    
    // Increase score for ATS-friendly templates
    if (template.style === 'modern' || template.style === 'classic') {
      score += 10;
    }
    
    // Consider CV data completeness
    const completedSections = [
      cvData.personalInfo.firstName,
      cvData.experiences.length > 0,
      cvData.education.length > 0,
      cvData.skills.length > 0,
    ].filter(Boolean).length;
    
    if (completedSections < 3) {
      score -= 20;
    }
    
    return Math.max(60, Math.min(100, score));
  };

  const getRecommendationReason = (template: CVTemplate): string => {
    if (template.style === 'modern') {
      return 'Great for tech and startup roles. ATS-friendly and contemporary.';
    } else if (template.style === 'creative') {
      return 'Perfect for creative industries like design, marketing, and media.';
    } else if (template.style === 'classic') {
      return 'Ideal for traditional industries like finance, law, and consulting.';
    } else if (template.style === 'minimal') {
      return 'Best for roles where content is key. Clean and distraction-free.';
    }
    return 'Versatile template suitable for various industries.';
  };

  return (
    <Box>
      {/* Header and Filters */}
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Palette sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Choose Your Template
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {filteredTemplates.length} templates available
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            💡 <strong>Pro Tip:</strong> Choose a template that matches your industry. Modern templates work well for tech roles, while classic templates are better for traditional industries.
          </Alert>

          {/* Filters */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Filter by Style:
              </Typography>
              <RadioGroup
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                row
              >
                {templateCategories.map((category) => (
                  <FormControlLabel
                    key={category.id}
                    value={category.id}
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {category.icon}
                        <Typography variant="body2" sx={{ ml: 0.5 }}>
                          {category.label}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Industry Recommendations</InputLabel>
                <Select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  label="Industry Recommendations"
                >
                  <MenuItem value="">All Industries</MenuItem>
                  {Object.keys(industryRecommendations).map((industry) => (
                    <MenuItem key={industry} value={industry}>
                      {industry}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <FilterList sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No templates match your filters
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filter criteria to see more options.
            </Typography>
            <Button
              onClick={() => {
                setFilterCategory('all');
                setIndustryFilter('');
              }}
              sx={{ mt: 2 }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredTemplates.map((template, index) => (
            <Grid item xs={12} sm={6} lg={4} key={template.id}>
              <Zoom in={true} timeout={300 * (index + 1)}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: selectedTemplate?.id === template.id ? 2 : 1,
                    borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                  onClick={() => onTemplateSelect(template)}
                >
                  {/* Selection Indicator */}
                  {selectedTemplate?.id === template.id && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1,
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        p: 0.5,
                      }}
                    >
                      <CheckCircle />
                    </Box>
                  )}

                  {/* Template Preview */}
                  <CardMedia
                    sx={{
                      height: 300,
                      bgcolor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {/* Mock CV Preview */}
                    <Box
                      sx={{
                        width: '80%',
                        height: '90%',
                        bgcolor: 'white',
                        border: 1,
                        borderColor: 'grey.300',
                        borderRadius: 1,
                        p: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                      }}
                    >
                      {/* Header */}
                      <Box
                        sx={{
                          height: 30,
                          bgcolor: template.color === 'blue' ? 'primary.main' : 
                                   template.color === 'gray' ? 'grey.600' :
                                   template.color === 'purple' ? 'secondary.main' : 'success.main',
                          borderRadius: 0.5,
                        }}
                      />
                      
                      {/* Content bars */}
                      {[0.8, 0.6, 0.9, 0.7, 0.5].map((width, i) => (
                        <Box
                          key={i}
                          sx={{
                            height: 8,
                            bgcolor: 'grey.300',
                            borderRadius: 0.5,
                            width: `${width * 100}%`,
                          }}
                        />
                      ))}
                    </Box>

                    {/* Preview Button Overlay */}
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(template);
                      }}
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                      }}
                    >
                      Preview
                    </Button>
                  </CardMedia>

                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {template.description}
                      </Typography>
                    </Box>

                    {/* Compatibility Score */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Compatibility
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {getCompatibilityScore(template)}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: 4,
                          bgcolor: 'grey.300',
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${getCompatibilityScore(template)}%`,
                            bgcolor: getCompatibilityScore(template) >= 80 ? 'success.main' :
                                     getCompatibilityScore(template) >= 60 ? 'warning.main' : 'error.main',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Features */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {getTemplateFeatures(template).map((feature) => (
                          <Chip
                            key={feature}
                            label={feature}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Recommendation */}
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      {getRecommendationReason(template)}
                    </Typography>
                  </CardContent>

                  <CardActions>
                    <Button
                      variant={selectedTemplate?.id === template.id ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        onTemplateSelect(template);
                      }}
                    >
                      {selectedTemplate?.id === template.id ? 'Selected' : 'Select Template'}
                    </Button>
                  </CardActions>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Selection Summary */}
      {selectedTemplate && (
        <Card sx={{ mt: 3, bgcolor: 'success.light' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6" fontWeight="bold" color="success.main">
                Template Selected: {selectedTemplate.name}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              {getRecommendationReason(selectedTemplate)}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {getTemplateFeatures(selectedTemplate).map((feature) => (
                <Chip
                  key={feature}
                  label={feature}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Template Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {previewTemplate?.name} Preview
            </Typography>
            <IconButton onClick={() => setPreviewOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {previewTemplate && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              {/* Enhanced preview would go here */}
              <Box
                sx={{
                  width: '100%',
                  height: 600,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h4" color="text.secondary">
                  CV Preview
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    onTemplateSelect(previewTemplate);
                    setPreviewOpen(false);
                  }}
                  size="large"
                >
                  Use This Template
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EnhancedTemplateStep;