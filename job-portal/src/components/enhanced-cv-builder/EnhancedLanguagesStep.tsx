import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import {
  Add,
  Delete,
  Language as LanguageIcon,
  Star,
} from '@mui/icons-material';
import { Language } from '../../services/cvBuilderService';

interface EnhancedLanguagesStepProps {
  data: Language[];
  onChange: (data: Language[]) => void;
  onAIHelp?: (action: string, data: any) => void;
}

const proficiencyLevels = [
  { value: 'Native', label: 'Native', description: 'Mother tongue / First language' },
  { value: 'Fluent', label: 'Fluent', description: 'Full professional proficiency' },
  { value: 'Advanced', label: 'Advanced', description: 'Advanced working proficiency' },
  { value: 'Intermediate', label: 'Intermediate', description: 'Limited working proficiency' },
  { value: 'Beginner', label: 'Beginner', description: 'Elementary proficiency' },
];

const commonLanguages = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese (Mandarin)',
  'Japanese', 'Korean', 'Arabic', 'Hindi', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Polish', 'Turkish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Tagalog'
];

const EnhancedLanguagesStep: React.FC<EnhancedLanguagesStepProps> = ({
  data,
  onChange,
  onAIHelp,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [newLanguage, setNewLanguage] = useState<Omit<Language, 'id'>>({
    language: '',
    proficiency: 'Intermediate',
    certification: '',
  });

  const addLanguage = () => {
    if (newLanguage.language.trim()) {
      const language: Language = {
        id: Date.now().toString(),
        ...newLanguage,
      };
      onChange([...data, language]);
      setNewLanguage({
        language: '',
        proficiency: 'Intermediate',
        certification: '',
      });
    }
  };

  const updateLanguage = (index: number, field: keyof Language, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  const deleteLanguage = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
  };

  const addCommonLanguage = (language: string) => {
    if (!data.some(l => l.language.toLowerCase() === language.toLowerCase())) {
      const newLang: Language = {
        id: Date.now().toString(),
        language,
        proficiency: 'Intermediate',
      };
      onChange([...data, newLang]);
    }
  };

  const getProficiencyIcon = (proficiency: string) => {
    const level = proficiencyLevels.find(p => p.value === proficiency);
    const stars = proficiency === 'Native' ? 5 :
                 proficiency === 'Fluent' ? 4 :
                 proficiency === 'Advanced' ? 3 :
                 proficiency === 'Intermediate' ? 2 : 1;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            sx={{
              fontSize: 16,
              color: i < stars ? 'primary.main' : 'action.disabled',
            }}
          />
        ))}
      </Box>
    );
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Header Card */}
        <Grid item xs={12}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            mb: 3 
          }}>
            <CardContent sx={{ py: isMobile ? 2 : 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LanguageIcon sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold">
                  Languages
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                Showcase your language skills to demonstrate cultural adaptability and communication abilities.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${data.length} Languages Added`}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
                {data.length >= 2 && (
                  <Chip 
                    label="✓ Good Coverage"
                    sx={{ 
                      bgcolor: 'rgba(76, 175, 80, 0.3)',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Add New Language Form */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Add /> Add Language
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Language"
                    value={newLanguage.language}
                    onChange={(e) => setNewLanguage(prev => ({ ...prev, language: e.target.value }))}
                    placeholder="e.g., Spanish, French, German"
                    size={isMobile ? "medium" : "small"}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size={isMobile ? "medium" : "small"}>
                    <InputLabel>Proficiency Level</InputLabel>
                    <Select
                      value={newLanguage.proficiency}
                      label="Proficiency Level"
                      onChange={(e) => setNewLanguage(prev => ({ ...prev, proficiency: e.target.value as any }))}
                    >
                      {proficiencyLevels.map((level) => (
                        <MenuItem key={level.value} value={level.value}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {level.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {level.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Certification (Optional)"
                    value={newLanguage.certification || ''}
                    onChange={(e) => setNewLanguage(prev => ({ ...prev, certification: e.target.value }))}
                    placeholder="e.g., TOEFL, IELTS, DELE"
                    size={isMobile ? "medium" : "small"}
                  />
                </Grid>
              </Grid>
              
              <Button
                onClick={addLanguage}
                startIcon={<Add />}
                variant="contained"
                disabled={!newLanguage.language.trim()}
                fullWidth={isMobile}
              >
                Add Language
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Add Common Languages */}
        {data.length < 3 && (
          <Grid item xs={12}>
            <Card sx={{ border: '1px dashed', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Quick Add Common Languages:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {commonLanguages.slice(0, 8).map((lang) => (
                    <Chip
                      key={lang}
                      label={lang}
                      onClick={() => addCommonLanguage(lang)}
                      variant="outlined"
                      size="small"
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        opacity: data.some(l => l.language.toLowerCase() === lang.toLowerCase()) ? 0.5 : 1,
                      }}
                      disabled={data.some(l => l.language.toLowerCase() === lang.toLowerCase())}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Current Languages */}
        {data.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Languages ({data.length})
                </Typography>
                
                <Grid container spacing={2}>
                  {data.map((language, index) => (
                    <Grid item xs={12} key={language.id}>
                      <Fade in={true} timeout={300 * (index + 1)}>
                        <Card variant="outlined">
                          <CardContent sx={{ py: isMobile ? 2 : 1.5 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} sm={3}>
                                <TextField
                                  fullWidth
                                  label="Language"
                                  value={language.language}
                                  onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                                  size="small"
                                />
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Proficiency</InputLabel>
                                  <Select
                                    value={language.proficiency}
                                    label="Proficiency"
                                    onChange={(e) => updateLanguage(index, 'proficiency', e.target.value)}
                                  >
                                    {proficiencyLevels.map((level) => (
                                      <MenuItem key={level.value} value={level.value}>
                                        {level.label}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <TextField
                                  fullWidth
                                  label="Certification"
                                  value={language.certification || ''}
                                  onChange={(e) => updateLanguage(index, 'certification', e.target.value)}
                                  placeholder="e.g., TOEFL 110"
                                  size="small"
                                />
                              </Grid>
                              <Grid item xs={12} sm={2}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {getProficiencyIcon(language.proficiency)}
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={1}>
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                  <IconButton
                                    onClick={() => deleteLanguage(index)}
                                    color="error"
                                    size="small"
                                  >
                                    <Delete />
                                  </IconButton>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Fade>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Tips */}
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Pro Tips:</strong>
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Be honest about your proficiency levels - employers may test language skills</li>
              <li>Include certifications with scores/grades when available (e.g., "TOEFL 110/120")</li>
              <li>Native speakers should still list their native language</li>
              <li>Consider including programming languages if relevant to your field</li>
            </ul>
          </Alert>
        </Grid>

        {data.length === 0 && (
          <Grid item xs={12}>
            <Card sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50' }}>
              <CardContent>
                <LanguageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No languages added yet
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Add your language skills to show employers your communication abilities and cultural adaptability.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default EnhancedLanguagesStep;