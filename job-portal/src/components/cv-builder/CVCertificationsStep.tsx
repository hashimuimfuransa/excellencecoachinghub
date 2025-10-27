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
  Alert,
  Link,
} from '@mui/material';
import {
  Add,
  Verified,
  Edit,
  Delete,
  CalendarToday,
  Business,
  Launch,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Certification } from '../../services/cvBuilderService';

interface CVCertificationsStepProps {
  data: Certification[];
  onChange: (data: Certification[]) => void;
  onGenerateAIContent: (prompt: string, section: string) => Promise<string>;
}

const CVCertificationsStep: React.FC<CVCertificationsStepProps> = ({
  data,
  onChange,
  onGenerateAIContent,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentCertification, setCurrentCertification] = useState<Certification>({
    id: '',
    name: '',
    issuingOrganization: '',
    issueDate: '',
    expirationDate: '',
    credentialId: '',
    credentialUrl: '',
    description: '',
  });

  const popularCertifications = [
    { name: 'AWS Certified Solutions Architect', org: 'Amazon Web Services' },
    { name: 'Google Cloud Professional Cloud Architect', org: 'Google Cloud' },
    { name: 'Microsoft Azure Fundamentals', org: 'Microsoft' },
    { name: 'Certified Kubernetes Administrator (CKA)', org: 'Cloud Native Computing Foundation' },
    { name: 'PMP - Project Management Professional', org: 'Project Management Institute' },
    { name: 'Certified ScrumMaster (CSM)', org: 'Scrum Alliance' },
    { name: 'CISSP - Certified Information Systems Security Professional', org: 'ISC2' },
    { name: 'CompTIA Security+', org: 'CompTIA' },
    { name: 'Oracle Certified Professional', org: 'Oracle' },
    { name: 'Salesforce Certified Administrator', org: 'Salesforce' },
    { name: 'Certified Ethical Hacker (CEH)', org: 'EC-Council' },
    { name: 'Six Sigma Green Belt', org: 'Various Organizations' },
    { name: 'ITIL Foundation', org: 'Axelos' },
    { name: 'Cisco Certified Network Associate (CCNA)', org: 'Cisco' },
  ];

  const handleOpenDialog = (certification?: Certification, index?: number) => {
    if (certification && index !== undefined) {
      setCurrentCertification({ ...certification });
      setEditingIndex(index);
    } else {
      setCurrentCertification({
        id: Date.now().toString(),
        name: '',
        issuingOrganization: '',
        issueDate: '',
        expirationDate: '',
        credentialId: '',
        credentialUrl: '',
        description: '',
      });
      setEditingIndex(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentCertification({
      id: '',
      name: '',
      issuingOrganization: '',
      issueDate: '',
      expirationDate: '',
      credentialId: '',
      credentialUrl: '',
      description: '',
    });
    setEditingIndex(null);
  };

  const handleInputChange = (field: keyof Certification, value: any) => {
    setCurrentCertification(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      const updatedData = [...data];
      updatedData[editingIndex] = currentCertification;
      onChange(updatedData);
    } else {
      onChange([...data, currentCertification]);
    }
    handleCloseDialog();
  };

  const handleDelete = (index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange(updatedData);
  };

  const selectPopularCertification = (cert: { name: string; org: string }) => {
    setCurrentCertification(prev => ({
      ...prev,
      name: cert.name,
      issuingOrganization: cert.org,
    }));
  };

  const isExpired = (certification: Certification) => {
    if (!certification.expirationDate) return false;
    return dayjs(certification.expirationDate).isBefore(dayjs());
  };

  const isExpiringSoon = (certification: Certification) => {
    if (!certification.expirationDate) return false;
    const expirationDate = dayjs(certification.expirationDate);
    const sixMonthsFromNow = dayjs().add(6, 'months');
    return expirationDate.isAfter(dayjs()) && expirationDate.isBefore(sixMonthsFromNow);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Certifications
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add Certification
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        Showcase your professional certifications, licenses, and credentials that validate your expertise.
      </Typography>

      {data.length === 0 ? (
        <Card sx={{ textAlign: 'center', p: 4, backgroundColor: '#f8f9fa' }}>
          <Verified sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No certifications added yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Add your professional certifications to demonstrate your verified skills and expertise.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add Your First Certification
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {data.map((certification, index) => (
            <Grid item xs={12} key={certification.id}>
              <Card 
                elevation={1} 
                sx={{ 
                  '&:hover': { elevation: 2 },
                  border: isExpired(certification) ? '1px solid #f44336' : isExpiringSoon(certification) ? '1px solid #ff9800' : 'none'
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Verified color="primary" />
                        <Typography variant="h6">
                          {certification.name}
                        </Typography>
                        {isExpired(certification) && (
                          <Chip 
                            label="Expired" 
                            size="small" 
                            color="error" 
                            icon={<Warning />} 
                          />
                        )}
                        {isExpiringSoon(certification) && (
                          <Chip 
                            label="Expiring Soon" 
                            size="small" 
                            color="warning" 
                            icon={<Warning />} 
                          />
                        )}
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {certification.issuingOrganization}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Issued: {dayjs(certification.issueDate).format('MMM YYYY')}
                          {certification.expirationDate && (
                            <span>
                              {' • Expires: '}
                              <span style={{ color: isExpired(certification) ? '#f44336' : isExpiringSoon(certification) ? '#ff9800' : 'inherit' }}>
                                {dayjs(certification.expirationDate).format('MMM YYYY')}
                              </span>
                            </span>
                          )}
                        </Typography>
                      </Box>

                      {certification.description && (
                        <Typography variant="body2" paragraph>
                          {certification.description}
                        </Typography>
                      )}

                      <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                        {certification.credentialId && (
                          <Chip
                            label={`ID: ${certification.credentialId}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {certification.credentialUrl && (
                          <Chip
                            icon={<Launch />}
                            label="Verify"
                            clickable
                            size="small"
                            color="primary"
                            onClick={() => window.open(certification.credentialUrl, '_blank')}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    <Box display="flex" flexDirection="column" gap={1}>
                      <IconButton onClick={() => handleOpenDialog(certification, index)} size="small">
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
          ))}
        </Grid>
      )}

      {/* Add/Edit Certification Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Edit Certification' : 'Add Certification'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Popular Certifications Quick Selection */}
            {editingIndex === null && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Popular Certifications (Click to auto-fill):
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                  {popularCertifications.slice(0, 8).map((cert, index) => (
                    <Chip
                      key={index}
                      label={cert.name}
                      size="small"
                      clickable
                      onClick={() => selectPopularCertification(cert)}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Certification Name"
                value={currentCertification.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., AWS Certified Solutions Architect"
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Issuing Organization"
                value={currentCertification.issuingOrganization}
                onChange={(e) => handleInputChange('issuingOrganization', e.target.value)}
                placeholder="e.g., Amazon Web Services"
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Issue Date"
                  value={currentCertification.issueDate ? dayjs(currentCertification.issueDate) : null}
                  onChange={(date) => handleInputChange('issueDate', date?.format('YYYY-MM-DD') || '')}
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

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Expiration Date (Optional)"
                  value={currentCertification.expirationDate ? dayjs(currentCertification.expirationDate) : null}
                  onChange={(date) => handleInputChange('expirationDate', date?.format('YYYY-MM-DD') || '')}
                  views={['year', 'month']}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "Leave blank if certification doesn't expire"
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Credential ID (Optional)"
                value={currentCertification.credentialId}
                onChange={(e) => handleInputChange('credentialId', e.target.value)}
                placeholder="e.g., ABC123456789"
                helperText="Certificate number or credential ID"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Credential URL (Optional)"
                value={currentCertification.credentialUrl}
                onChange={(e) => handleInputChange('credentialUrl', e.target.value)}
                placeholder="https://verify.example.com/credential"
                helperText="Link to verify the certification"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                value={currentCertification.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={2}
                placeholder="Brief description of what this certification covers"
                helperText="Optional description of skills or knowledge validated by this certification"
              />
            </Grid>
          </Grid>

          {/* Expiration Warning */}
          {currentCertification.expirationDate && (
            <Box mt={2}>
              {dayjs(currentCertification.expirationDate).isBefore(dayjs()) && (
                <Alert severity="error" icon={<Warning />}>
                  This certification has expired. Consider renewing it or adding a renewed version.
                </Alert>
              )}
              {dayjs(currentCertification.expirationDate).isAfter(dayjs()) && 
               dayjs(currentCertification.expirationDate).isBefore(dayjs().add(6, 'months')) && (
                <Alert severity="warning" icon={<Warning />}>
                  This certification expires soon. Consider planning for renewal.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={!currentCertification.name || !currentCertification.issuingOrganization}
          >
            {editingIndex !== null ? 'Update' : 'Add'} Certification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CVCertificationsStep;