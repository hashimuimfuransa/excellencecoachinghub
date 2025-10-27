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
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
  Fade,
  Link,
} from '@mui/material';
import {
  Add,
  Delete,
  WorkspacePremium,
  Link as LinkIcon,
  CalendarToday,
  Verified,
  School,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Certification } from '../../services/cvBuilderService';

interface EnhancedCertificationsStepProps {
  data: Certification[];
  onChange: (data: Certification[]) => void;
  onAIHelp?: (action: string, data: any) => void;
}

const defaultCertification: Omit<Certification, 'id'> = {
  name: '',
  issuingOrganization: '',
  issueDate: '',
  expiryDate: '',
  credentialId: '',
  credentialUrl: '',
  description: '',
};

const popularCertifications = [
  // Tech Certifications
  { name: 'AWS Certified Solutions Architect', org: 'Amazon Web Services' },
  { name: 'Google Cloud Professional Cloud Architect', org: 'Google Cloud' },
  { name: 'Microsoft Azure Fundamentals (AZ-900)', org: 'Microsoft' },
  { name: 'Certified Kubernetes Administrator (CKA)', org: 'Cloud Native Computing Foundation' },
  { name: 'PMP (Project Management Professional)', org: 'PMI' },
  { name: 'CISSP', org: 'ISC2' },
  { name: 'Certified ScrumMaster (CSM)', org: 'Scrum Alliance' },
  { name: 'Google Analytics Certified', org: 'Google' },
  
  // Business Certifications
  { name: 'CPA (Certified Public Accountant)', org: 'AICPA' },
  { name: 'ACCA', org: 'Association of Chartered Certified Accountants' },
  { name: 'CFA (Chartered Financial Analyst)', org: 'CFA Institute' },
  { name: 'Six Sigma Black Belt', org: 'ASQ' },
  { name: 'SHRM Certified Professional', org: 'SHRM' },
  
  // Language Certifications
  { name: 'TOEFL iBT', org: 'ETS' },
  { name: 'IELTS', org: 'British Council' },
  { name: 'DELE', org: 'Instituto Cervantes' },
  { name: 'DELF/DALF', org: 'CIEP' },
];

const EnhancedCertificationsStep: React.FC<EnhancedCertificationsStepProps> = ({
  data,
  onChange,
  onAIHelp,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [newCertification, setNewCertification] = useState<Omit<Certification, 'id'>>(defaultCertification);

  const addCertification = () => {
    if (newCertification.name.trim() && newCertification.issuingOrganization.trim()) {
      const certification: Certification = {
        ...newCertification,
        id: Date.now().toString(),
      };
      onChange([...data, certification]);
      setNewCertification(defaultCertification);
    }
  };

  const updateCertification = (index: number, field: keyof Certification, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  const deleteCertification = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
  };

  const addPopularCertification = (cert: { name: string; org: string }) => {
    const exists = data.some(c => 
      c.name.toLowerCase().includes(cert.name.toLowerCase()) ||
      cert.name.toLowerCase().includes(c.name.toLowerCase())
    );
    
    if (!exists) {
      setNewCertification({
        ...defaultCertification,
        name: cert.name,
        issuingOrganization: cert.org,
      });
    }
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    return dayjs(dateString).format('MMM YYYY');
  };

  const isExpiringSoon = (expiryDate: string): boolean => {
    if (!expiryDate) return false;
    const expiry = dayjs(expiryDate);
    const threeMonthsFromNow = dayjs().add(3, 'months');
    return expiry.isBefore(threeMonthsFromNow) && expiry.isAfter(dayjs());
  };

  const isExpired = (expiryDate: string): boolean => {
    if (!expiryDate) return false;
    return dayjs(expiryDate).isBefore(dayjs());
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                  <WorkspacePremium sx={{ mr: 1, fontSize: 28 }} />
                  <Typography variant="h5" fontWeight="bold">
                    Certifications & Licenses
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                  Add your professional certifications, licenses, and training to showcase your qualifications and commitment to continuous learning.
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`${data.length} Certifications`}
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                  {data.length >= 3 && (
                    <Chip 
                      label="✓ Well Qualified"
                      sx={{ 
                        bgcolor: 'rgba(76, 175, 80, 0.3)',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  )}
                  {data.some(c => isExpiringSoon(c.expiryDate || '')) && (
                    <Chip 
                      label="⚠ Renewals Due"
                      sx={{ 
                        bgcolor: 'rgba(255, 152, 0, 0.3)',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Add New Certification Form */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Add /> Add Certification
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Certification Name"
                      value={newCertification.name}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., AWS Certified Solutions Architect"
                      size={isMobile ? "medium" : "small"}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Issuing Organization"
                      value={newCertification.issuingOrganization}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, issuingOrganization: e.target.value }))}
                      placeholder="e.g., Amazon Web Services"
                      size={isMobile ? "medium" : "small"}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Issue Date"
                      value={newCertification.issueDate ? dayjs(newCertification.issueDate) : null}
                      onChange={(date) => setNewCertification(prev => ({ 
                        ...prev, 
                        issueDate: date?.format('YYYY-MM-DD') || '' 
                      }))}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: isMobile ? "medium" : "small",
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Expiry Date (Optional)"
                      value={newCertification.expiryDate ? dayjs(newCertification.expiryDate) : null}
                      onChange={(date) => setNewCertification(prev => ({ 
                        ...prev, 
                        expiryDate: date?.format('YYYY-MM-DD') || '' 
                      }))}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: isMobile ? "medium" : "small",
                          helperText: 'Leave blank if certification does not expire'
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Credential ID (Optional)"
                      value={newCertification.credentialId || ''}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, credentialId: e.target.value }))}
                      placeholder="e.g., ABC123456789"
                      size={isMobile ? "medium" : "small"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Credential URL (Optional)"
                      value={newCertification.credentialUrl || ''}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, credentialUrl: e.target.value }))}
                      placeholder="https://verify.example.com/credential"
                      size={isMobile ? "medium" : "small"}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description (Optional)"
                      value={newCertification.description || ''}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the certification and skills gained..."
                      multiline
                      rows={2}
                      size={isMobile ? "medium" : "small"}
                    />
                  </Grid>
                </Grid>
                
                <Button
                  onClick={addCertification}
                  startIcon={<Add />}
                  variant="contained"
                  disabled={!newCertification.name.trim() || !newCertification.issuingOrganization.trim()}
                  fullWidth={isMobile}
                >
                  Add Certification
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Popular Certifications */}
          {data.length < 3 && (
            <Grid item xs={12}>
              <Card sx={{ border: '1px dashed', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Popular Certifications (click to add):
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {popularCertifications.slice(0, 12).map((cert, index) => {
                      const exists = data.some(c => 
                        c.name.toLowerCase().includes(cert.name.toLowerCase()) ||
                        cert.name.toLowerCase().includes(c.name.toLowerCase())
                      );
                      
                      return (
                        <Chip
                          key={index}
                          label={cert.name}
                          onClick={() => addPopularCertification(cert)}
                          variant="outlined"
                          size="small"
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' },
                            opacity: exists ? 0.5 : 1,
                          }}
                          disabled={exists}
                        />
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Current Certifications */}
          {data.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Your Certifications ({data.length})
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {data.map((certification, index) => (
                      <Grid item xs={12} key={certification.id}>
                        <Fade in={true} timeout={300 * (index + 1)}>
                          <Card variant="outlined" sx={{
                            borderColor: isExpired(certification.expiryDate || '') ? 'error.main' :
                                        isExpiringSoon(certification.expiryDate || '') ? 'warning.main' : 'divider'
                          }}>
                            <CardContent sx={{ py: isMobile ? 2 : 1.5 }}>
                              <Grid container spacing={2} alignItems="flex-start">
                                <Grid item xs={12} sm={8}>
                                  <Box sx={{ mb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                      <WorkspacePremium color="primary" sx={{ fontSize: 18 }} />
                                      <Typography variant="subtitle1" fontWeight="bold">
                                        {certification.name}
                                      </Typography>
                                      {certification.credentialUrl && (
                                        <IconButton
                                          size="small"
                                          onClick={() => window.open(certification.credentialUrl, '_blank')}
                                        >
                                          <Verified color="success" sx={{ fontSize: 16 }} />
                                        </IconButton>
                                      )}
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                      {certification.issuingOrganization}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Issued: {formatDateForDisplay(certification.issueDate)}
                                      </Typography>
                                      {certification.expiryDate && (
                                        <Typography 
                                          variant="caption" 
                                          color={isExpired(certification.expiryDate) ? 'error' :
                                                isExpiringSoon(certification.expiryDate) ? 'warning.main' : 'text.secondary'}
                                        >
                                          {isExpired(certification.expiryDate) ? 'Expired: ' : 'Expires: '}
                                          {formatDateForDisplay(certification.expiryDate)}
                                        </Typography>
                                      )}
                                    </Box>
                                    {certification.credentialId && (
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                        ID: {certification.credentialId}
                                      </Typography>
                                    )}
                                    {certification.description && (
                                      <Typography variant="body2" sx={{ mt: 1 }}>
                                        {certification.description}
                                      </Typography>
                                    )}
                                    {certification.credentialUrl && (
                                      <Link
                                        href={certification.credentialUrl}
                                        target="_blank"
                                        rel="noopener"
                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, fontSize: '0.875rem' }}
                                      >
                                        <LinkIcon sx={{ fontSize: 14 }} />
                                        Verify Credential
                                      </Link>
                                    )}
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, height: '100%', alignItems: 'flex-start' }}>
                                    {isExpired(certification.expiryDate || '') && (
                                      <Chip label="Expired" size="small" color="error" />
                                    )}
                                    {isExpiringSoon(certification.expiryDate || '') && !isExpired(certification.expiryDate || '') && (
                                      <Chip label="Renew Soon" size="small" color="warning" />
                                    )}
                                    {!certification.expiryDate && (
                                      <Chip label="No Expiry" size="small" color="success" />
                                    )}
                                    <IconButton
                                      onClick={() => deleteCertification(index)}
                                      color="error"
                                      size="small"
                                    >
                                      <Delete />
                                    </IconButton>
                                  </Box>
                                </Grid>
                              </Grid>
                              
                              {/* Edit Form (simplified for now) */}
                              <Grid container spacing={2} sx={{ mt: 1, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    fullWidth
                                    label="Certification Name"
                                    value={certification.name}
                                    onChange={(e) => updateCertification(index, 'name', e.target.value)}
                                    size="small"
                                  />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    fullWidth
                                    label="Issuing Organization"
                                    value={certification.issuingOrganization}
                                    onChange={(e) => updateCertification(index, 'issuingOrganization', e.target.value)}
                                    size="small"
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <DatePicker
                                    label="Issue Date"
                                    value={certification.issueDate ? dayjs(certification.issueDate) : null}
                                    onChange={(date) => updateCertification(index, 'issueDate', date?.format('YYYY-MM-DD'))}
                                    slotProps={{
                                      textField: { fullWidth: true, size: "small" }
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <DatePicker
                                    label="Expiry Date"
                                    value={certification.expiryDate ? dayjs(certification.expiryDate) : null}
                                    onChange={(date) => updateCertification(index, 'expiryDate', date?.format('YYYY-MM-DD') || '')}
                                    slotProps={{
                                      textField: { fullWidth: true, size: "small" }
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <TextField
                                    fullWidth
                                    label="Credential ID"
                                    value={certification.credentialId || ''}
                                    onChange={(e) => updateCertification(index, 'credentialId', e.target.value)}
                                    size="small"
                                  />
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

          {/* Empty State */}
          {data.length === 0 && (
            <Grid item xs={12}>
              <Card sx={{ textAlign: 'center', py: 6, bgcolor: 'grey.50' }}>
                <CardContent>
                  <WorkspacePremium sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No certifications added yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Add your professional certifications, licenses, and training to showcase your qualifications and demonstrate your commitment to continuous learning.
                  </Typography>
                  <Button
                    onClick={() => {
                      // Scroll to add form
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    variant="outlined"
                    startIcon={<Add />}
                  >
                    Add Certification
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Tips */}
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Certification Tips:</strong>
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Include relevant certifications that align with your target role</li>
                <li>List certifications in reverse chronological order (newest first)</li>
                <li>Include credential IDs and verification links when possible</li>
                <li>Keep expired certifications if they're still relevant and note the expiry</li>
                <li>Consider adding online course certificates from reputable platforms</li>
              </ul>
            </Alert>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default EnhancedCertificationsStep;