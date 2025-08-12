import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Slider,
  TextField,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Psychology,
  Quiz,
  Security,
  Feedback,
  Edit,
  Delete,
  Add,
  Save,
  Refresh,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { aiService, AISettings as IAISettings, FeedbackTemplate } from '../../services/aiService';

// Mock AI settings data
const mockAISettings = {
  aiGrading: {
    enabled: true,
    confidence: 85,
    autoGradeThreshold: 90,
    humanReviewRequired: true
  },
  quizGeneration: {
    enabled: true,
    difficulty: 'medium',
    questionsPerQuiz: 10,
    categories: ['multiple-choice', 'true-false', 'short-answer']
  },
  cheatingDetection: {
    enabled: true,
    sensitivity: 75,
    faceDetection: true,
    eyeTracking: true,
    tabSwitching: true,
    copyPasteDetection: true,
    multiplePersons: true
  },
  feedbackTemplates: [
    {
      id: '1',
      name: 'Excellent Performance',
      category: 'positive',
      template: 'Excellent work! You demonstrated a strong understanding of the concepts.',
      usage: 245
    },
    {
      id: '2',
      name: 'Needs Improvement',
      category: 'constructive',
      template: 'Good effort! Consider reviewing the following topics: {topics}',
      usage: 189
    },
    {
      id: '3',
      name: 'Partial Understanding',
      category: 'neutral',
      template: 'You show partial understanding. Focus on {specific_areas} for improvement.',
      usage: 156
    }
  ]
};

const AISettings: React.FC = () => {
  const [settings, setSettings] = useState(mockAISettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'neutral',
    template: ''
  });

  // Handle AI grading settings
  const handleAIGradingChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      aiGrading: {
        ...prev.aiGrading,
        [field]: value
      }
    }));
  };

  // Handle quiz generation settings
  const handleQuizGenerationChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      quizGeneration: {
        ...prev.quizGeneration,
        [field]: value
      }
    }));
  };

  // Handle cheating detection settings
  const handleCheatingDetectionChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      cheatingDetection: {
        ...prev.cheatingDetection,
        [field]: value
      }
    }));
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('AI settings saved successfully!');
    } catch (err) {
      setError('Failed to save AI settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle template operations
  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setNewTemplate({ name: '', category: 'neutral', template: '' });
    setTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      category: template.category,
      template: template.template
    });
    setTemplateDialogOpen(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setSettings(prev => ({
      ...prev,
      feedbackTemplates: prev.feedbackTemplates.filter(t => t.id !== templateId)
    }));
    setSuccess('Template deleted successfully');
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      // Edit existing template
      setSettings(prev => ({
        ...prev,
        feedbackTemplates: prev.feedbackTemplates.map(t =>
          t.id === editingTemplate.id
            ? { ...t, ...newTemplate }
            : t
        )
      }));
      setSuccess('Template updated successfully');
    } else {
      // Add new template
      const newId = Date.now().toString();
      setSettings(prev => ({
        ...prev,
        feedbackTemplates: [
          ...prev.feedbackTemplates,
          { ...newTemplate, id: newId, usage: 0 }
        ]
      }));
      setSuccess('Template added successfully');
    }
    setTemplateDialogOpen(false);
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'positive':
        return 'success';
      case 'constructive':
        return 'warning';
      case 'neutral':
        return 'info';
      default:
        return 'default';
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom>
              AI Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure AI-powered features for grading, quiz generation, and cheating detection.
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveSettings}
              disabled={loading}
            >
              Save Settings
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* AI Grading Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Psychology color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">AI Grading</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.aiGrading.enabled}
                    onChange={(e) => handleAIGradingChange('enabled', e.target.checked)}
                  />
                }
                label="Enable AI Grading"
                sx={{ mb: 2 }}
              />
              
              {settings.aiGrading.enabled && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    AI Confidence Threshold: {settings.aiGrading.confidence}%
                  </Typography>
                  <Slider
                    value={settings.aiGrading.confidence}
                    onChange={(e, value) => handleAIGradingChange('confidence', value)}
                    min={50}
                    max={100}
                    step={5}
                    marks
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography variant="body2" gutterBottom>
                    Auto-Grade Threshold: {settings.aiGrading.autoGradeThreshold}%
                  </Typography>
                  <Slider
                    value={settings.aiGrading.autoGradeThreshold}
                    onChange={(e, value) => handleAIGradingChange('autoGradeThreshold', value)}
                    min={70}
                    max={100}
                    step={5}
                    marks
                    sx={{ mb: 2 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.aiGrading.humanReviewRequired}
                        onChange={(e) => handleAIGradingChange('humanReviewRequired', e.target.checked)}
                      />
                    }
                    label="Require Human Review"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quiz Generation Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Quiz color="success" sx={{ mr: 2 }} />
                <Typography variant="h6">AI Quiz Generation</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.quizGeneration.enabled}
                    onChange={(e) => handleQuizGenerationChange('enabled', e.target.checked)}
                  />
                }
                label="Enable AI Quiz Generation"
                sx={{ mb: 2 }}
              />
              
              {settings.quizGeneration.enabled && (
                <Box>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Default Difficulty</InputLabel>
                    <Select
                      value={settings.quizGeneration.difficulty}
                      onChange={(e) => handleQuizGenerationChange('difficulty', e.target.value)}
                      label="Default Difficulty"
                    >
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="Questions per Quiz"
                    type="number"
                    value={settings.quizGeneration.questionsPerQuiz}
                    onChange={(e) => handleQuizGenerationChange('questionsPerQuiz', parseInt(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography variant="body2" gutterBottom>
                    Supported Question Types:
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {settings.quizGeneration.categories.map((category) => (
                      <Chip key={category} label={category} size="small" />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cheating Detection Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Security color="error" sx={{ mr: 2 }} />
                <Typography variant="h6">Cheating Detection</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.cheatingDetection.enabled}
                    onChange={(e) => handleCheatingDetectionChange('enabled', e.target.checked)}
                  />
                }
                label="Enable Cheating Detection"
                sx={{ mb: 2 }}
              />
              
              {settings.cheatingDetection.enabled && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" gutterBottom>
                      Detection Sensitivity: {settings.cheatingDetection.sensitivity}%
                    </Typography>
                    <Slider
                      value={settings.cheatingDetection.sensitivity}
                      onChange={(e, value) => handleCheatingDetectionChange('sensitivity', value)}
                      min={25}
                      max={100}
                      step={5}
                      marks
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
                      Detection Methods:
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.cheatingDetection.faceDetection}
                          onChange={(e) => handleCheatingDetectionChange('faceDetection', e.target.checked)}
                        />
                      }
                      label="Face Detection"
                      sx={{ display: 'block', mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.cheatingDetection.eyeTracking}
                          onChange={(e) => handleCheatingDetectionChange('eyeTracking', e.target.checked)}
                        />
                      }
                      label="Eye Tracking"
                      sx={{ display: 'block', mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.cheatingDetection.tabSwitching}
                          onChange={(e) => handleCheatingDetectionChange('tabSwitching', e.target.checked)}
                        />
                      }
                      label="Tab Switching Detection"
                      sx={{ display: 'block', mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.cheatingDetection.copyPasteDetection}
                          onChange={(e) => handleCheatingDetectionChange('copyPasteDetection', e.target.checked)}
                        />
                      }
                      label="Copy/Paste Detection"
                      sx={{ display: 'block', mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.cheatingDetection.multiplePersons}
                          onChange={(e) => handleCheatingDetectionChange('multiplePersons', e.target.checked)}
                        />
                      }
                      label="Multiple Persons Detection"
                      sx={{ display: 'block' }}
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Feedback Templates */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center">
                  <Feedback color="info" sx={{ mr: 2 }} />
                  <Typography variant="h6">AI Feedback Templates</Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddTemplate}
                >
                  Add Template
                </Button>
              </Box>
              
              <List>
                {settings.feedbackTemplates.map((template, index) => (
                  <React.Fragment key={template.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1">{template.name}</Typography>
                            <Chip
                              label={template.category}
                              color={getCategoryColor(template.category)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {template.template}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Used {template.usage} times
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleEditTemplate(template)}
                          sx={{ mr: 1 }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteTemplate(template.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < settings.feedbackTemplates.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Template' : 'Add New Template'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Template Name"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={newTemplate.category}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                label="Category"
              >
                <MenuItem value="positive">Positive</MenuItem>
                <MenuItem value="constructive">Constructive</MenuItem>
                <MenuItem value="neutral">Neutral</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Template Content"
              multiline
              rows={4}
              value={newTemplate.template}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, template: e.target.value }))}
              helperText="Use {topics}, {specific_areas}, {score} as placeholders for dynamic content"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveTemplate}
            disabled={!newTemplate.name || !newTemplate.template}
          >
            {editingTemplate ? 'Update' : 'Add'} Template
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AISettings;
