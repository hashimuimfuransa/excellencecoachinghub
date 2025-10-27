import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
  Stack,
} from '@mui/material';
import {
  Add,
  Language as LanguageIcon,
  Edit,
  Delete,
  Star,
  StarBorder,
  Public,
  School,
} from '@mui/icons-material';
import { Language } from '../../services/cvBuilderService';

interface CVLanguagesStepProps {
  data: Language[];
  onChange: (data: Language[]) => void;
  onGenerateAIContent: (prompt: string, section: string) => Promise<string>;
}

const CVLanguagesStep: React.FC<CVLanguagesStepProps> = ({
  data,
  onChange,
  onGenerateAIContent,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>({
    id: '',
    name: '',
    level: 'Beginner',
    certification: '',
  });

  const languageLevels: { value: Language['level']; label: string; percentage: number; stars: number }[] = [
    { value: 'Native', label: 'Native', percentage: 100, stars: 5 },
    { value: 'Fluent', label: 'Fluent', percentage: 90, stars: 5 },
    { value: 'Advanced', label: 'Advanced', percentage: 75, stars: 4 },
    { value: 'Intermediate', label: 'Intermediate', percentage: 60, stars: 3 },
    { value: 'Beginner', label: 'Beginner', percentage: 30, stars: 2 },
  ];

  const commonLanguages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Russian',
    'Chinese (Mandarin)', 'Chinese (Cantonese)', 'Japanese', 'Korean', 'Arabic', 'Hindi',
    'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian', 'Greek',
    'Turkish', 'Hebrew', 'Persian', 'Thai', 'Vietnamese', 'Indonesian', 'Swahili'
  ];

  const handleOpenDialog = (language?: Language, index?: number) => {
    if (language && index !== undefined) {
      setCurrentLanguage({ ...language });
      setEditingIndex(index);
    } else {
      setCurrentLanguage({
        id: Date.now().toString(),
        name: '',
        level: 'Beginner',
        certification: '',
      });
      setEditingIndex(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentLanguage({
      id: '',
      name: '',
      level: 'Beginner',
      certification: '',
    });
    setEditingIndex(null);
  };

  const handleInputChange = (field: keyof Language, value: any) => {
    setCurrentLanguage(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      const updatedData = [...data];
      updatedData[editingIndex] = currentLanguage;
      onChange(updatedData);
    } else {
      onChange([...data, currentLanguage]);
    }
    handleCloseDialog();
  };

  const handleDelete = (index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange(updatedData);
  };

  const getLevelInfo = (level: Language['level']) => {
    return languageLevels.find(l => l.value === level) || languageLevels[4];
  };

  const renderStars = (level: Language['level']) => {
    const levelInfo = getLevelInfo(level);
    const stars = [];
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        i < levelInfo.stars ? (
          <Star key={i} sx={{ fontSize: 16, color: 'gold' }} />
        ) : (
          <StarBorder key={i} sx={{ fontSize: 16, color: 'text.disabled' }} />
        )
      );
    }
    
    return stars;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Languages
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add Language
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        List the languages you speak and your proficiency level. Include any language certifications you may have.
      </Typography>

      {data.length === 0 ? (
        <Card sx={{ textAlign: 'center', p: 4, backgroundColor: '#f8f9fa' }}>
          <LanguageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No languages added yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Showcase your language skills to demonstrate your global communication abilities.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add Your First Language
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {data.map((language, index) => {
            const levelInfo = getLevelInfo(language.level);
            return (
              <Grid item xs={12} sm={6} md={4} key={language.id}>
                <Card elevation={1} sx={{ '&:hover': { elevation: 2 }, height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box flex={1}>
                        <Typography variant="h6" gutterBottom>
                          {language.name}
                        </Typography>
                        
                        <Typography variant="body2" color="primary" gutterBottom>
                          {levelInfo.label}
                        </Typography>

                        <Box mb={2}>
                          <LinearProgress 
                            variant="determinate" 
                            value={levelInfo.percentage} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                              }
                            }} 
                          />
                        </Box>

                        <Box display="flex" alignItems="center" gap={0.5} mb={2}>
                          {renderStars(language.level)}
                        </Box>

                        {language.certification && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <School sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {language.certification}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      <Box display="flex" flexDirection="column" gap={1}>
                        <IconButton onClick={() => handleOpenDialog(language, index)} size="small">
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(index)} size="small" color="error">
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add/Edit Language Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Edit Language' : 'Add Language'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={currentLanguage.name}
                  label="Language"
                  onChange={(e) => handleInputChange('name', e.target.value)}
                >
                  {commonLanguages.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {lang}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Don't see your language? You can type a custom language name after selecting.
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Custom Language (if not in list)"
                value={currentLanguage.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Type language name"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Proficiency Level</InputLabel>
                <Select
                  value={currentLanguage.level}
                  label="Proficiency Level"
                  onChange={(e) => handleInputChange('level', e.target.value)}
                >
                  {languageLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      <Box display="flex" alignItems="center" gap={2} width="100%">
                        <Box flex={1}>{level.label}</Box>
                        <Box display="flex" gap={0.5}>
                          {Array.from({ length: 5 }, (_, i) => 
                            i < level.stars ? (
                              <Star key={i} sx={{ fontSize: 14, color: 'gold' }} />
                            ) : (
                              <StarBorder key={i} sx={{ fontSize: 14, color: 'text.disabled' }} />
                            )
                          )}
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Certification (Optional)"
                value={currentLanguage.certification}
                onChange={(e) => handleInputChange('certification', e.target.value)}
                placeholder="e.g., TOEFL 110, DELE B2, JLPT N2"
                helperText="Include language certifications, test scores, or qualifications"
              />
            </Grid>
          </Grid>

          <Box mt={3} p={2} sx={{ backgroundColor: 'info.light', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              💡 Language Level Guide:
            </Typography>
            <Stack spacing={1}>
              {languageLevels.map((level) => (
                <Box key={level.value} display="flex" alignItems="center" gap={2}>
                  <Typography variant="body2" sx={{ minWidth: 80, fontWeight: 'bold' }}>
                    {level.label}:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {level.value === 'Native' && 'Your mother tongue or equivalent fluency'}
                    {level.value === 'Fluent' && 'Speak effortlessly and accurately in all situations'}
                    {level.value === 'Advanced' && 'Handle complex topics and professional contexts'}
                    {level.value === 'Intermediate' && 'Handle most everyday situations comfortably'}
                    {level.value === 'Beginner' && 'Basic conversational ability'}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={!currentLanguage.name}
          >
            {editingIndex !== null ? 'Update' : 'Add'} Language
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CVLanguagesStep;