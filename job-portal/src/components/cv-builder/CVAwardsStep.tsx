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
  Chip,
  Stack,
} from '@mui/material';
import {
  Add,
  EmojiEvents,
  Edit,
  Delete,
  CalendarToday,
  Business,
  Star,
  Grade,
  WorkspacePremium,
  Shield,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Award } from '../../services/cvBuilderService';

interface CVAwardsStepProps {
  data: Award[];
  onChange: (data: Award[]) => void;
  onGenerateAIContent: (prompt: string, section: string) => Promise<string>;
}

const CVAwardsStep: React.FC<CVAwardsStepProps> = ({
  data,
  onChange,
  onGenerateAIContent,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentAward, setCurrentAward] = useState<Award>({
    id: '',
    name: '',
    issuingOrganization: '',
    date: '',
    description: '',
  });

  const awardCategories = [
    { label: 'Academic Excellence', icon: <Grade />, color: '#1976d2' },
    { label: 'Professional Achievement', icon: <WorkspacePremium />, color: '#7b1fa2' },
    { label: 'Industry Recognition', icon: <Star />, color: '#f57c00' },
    { label: 'Leadership Award', icon: <Shield />, color: '#388e3c' },
    { label: 'Innovation Award', icon: <EmojiEvents />, color: '#d32f2f' },
  ];

  const handleOpenDialog = (award?: Award, index?: number) => {
    if (award && index !== undefined) {
      setCurrentAward({ ...award });
      setEditingIndex(index);
    } else {
      setCurrentAward({
        id: Date.now().toString(),
        name: '',
        issuingOrganization: '',
        date: '',
        description: '',
      });
      setEditingIndex(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentAward({
      id: '',
      name: '',
      issuingOrganization: '',
      date: '',
      description: '',
    });
    setEditingIndex(null);
  };

  const handleInputChange = (field: keyof Award, value: any) => {
    setCurrentAward(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      const updatedData = [...data];
      updatedData[editingIndex] = currentAward;
      onChange(updatedData);
    } else {
      onChange([...data, currentAward]);
    }
    handleCloseDialog();
  };

  const handleDelete = (index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange(updatedData);
  };

  const getAwardIcon = (awardName: string) => {
    const name = awardName.toLowerCase();
    if (name.includes('academic') || name.includes('dean') || name.includes('scholar')) {
      return <Grade color="primary" />;
    }
    if (name.includes('employee') || name.includes('performance') || name.includes('excellence')) {
      return <WorkspacePremium color="secondary" />;
    }
    if (name.includes('leadership') || name.includes('manager') || name.includes('team')) {
      return <Shield color="success" />;
    }
    if (name.includes('innovation') || name.includes('best') || name.includes('top')) {
      return <Star sx={{ color: '#ff9800' }} />;
    }
    return <EmojiEvents color="error" />;
  };

  const sortedAwards = [...data].sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Awards & Achievements
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add Award
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        Highlight your awards, recognitions, and significant achievements that demonstrate excellence in your field.
      </Typography>

      {data.length === 0 ? (
        <Card sx={{ textAlign: 'center', p: 4, backgroundColor: '#f8f9fa' }}>
          <EmojiEvents sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No awards added yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Showcase your achievements and recognitions to stand out from other candidates.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add Your First Award
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {sortedAwards.map((award, index) => {
            const originalIndex = data.findIndex(a => a.id === award.id);
            return (
              <Grid item xs={12} md={6} key={award.id}>
                <Card 
                  elevation={1} 
                  sx={{ 
                    '&:hover': { elevation: 2 },
                    height: '100%',
                    background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          {getAwardIcon(award.name)}
                          <Typography variant="h6">
                            {award.name}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {award.issuingOrganization}
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {dayjs(award.date).format('MMMM YYYY')}
                          </Typography>
                        </Box>

                        {award.description && (
                          <Typography variant="body2" color="text.primary">
                            {award.description}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box display="flex" flexDirection="column" gap={1}>
                        <IconButton onClick={() => handleOpenDialog(award, originalIndex)} size="small">
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(originalIndex)} size="small" color="error">
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

      {/* Add/Edit Award Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Edit Award' : 'Add Award'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Award Categories:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {awardCategories.map((category) => (
                  <Chip
                    key={category.label}
                    icon={category.icon}
                    label={category.label}
                    size="small"
                    clickable
                    variant="outlined"
                    onClick={() => {
                      // Auto-suggest award name based on category
                      if (!currentAward.name) {
                        setCurrentAward(prev => ({
                          ...prev,
                          name: category.label
                        }));
                      }
                    }}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: category.color + '20',
                        borderColor: category.color 
                      }
                    }}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Award Name"
                value={currentAward.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Employee of the Year, Dean's List, Best Innovation Award"
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Issuing Organization"
                value={currentAward.issuingOrganization}
                onChange={(e) => handleInputChange('issuingOrganization', e.target.value)}
                placeholder="e.g., Microsoft, Harvard University, IEEE"
                required
              />
            </Grid>

            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date Received"
                  value={currentAward.date ? dayjs(currentAward.date) : null}
                  onChange={(date) => handleInputChange('date', date?.format('YYYY-MM-DD') || '')}
                  views={['year', 'month']}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={currentAward.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={3}
                placeholder="Describe what you achieved to earn this award and its significance..."
                helperText="Explain the criteria, your achievement, and the impact or recognition it represents"
              />
            </Grid>
          </Grid>

          <Box mt={3} p={2} sx={{ backgroundColor: 'info.light', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              💡 Tips for Awards & Achievements:
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                • Include awards from work, education, volunteer activities, or professional organizations
              </Typography>
              <Typography variant="body2">
                • Mention any ranking (e.g., "Top 1% performer" or "1st place out of 500 participants")
              </Typography>
              <Typography variant="body2">
                • Add context about the selection criteria or competition level
              </Typography>
              <Typography variant="body2">
                • Include both recent achievements and significant historical ones
              </Typography>
            </Stack>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={!currentAward.name || !currentAward.issuingOrganization || !currentAward.date}
          >
            {editingIndex !== null ? 'Update' : 'Add'} Award
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CVAwardsStep;