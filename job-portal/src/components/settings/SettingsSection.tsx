import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Fade,
  Skeleton
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  CheckCircle,
  HelpOutline
} from '@mui/icons-material';

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  sectionKey: string;
  onSave: () => void;
  editingSection: string | null;
  setEditingSection: (section: string | null) => void;
  loading?: boolean;
  saved?: boolean;
  helpText?: string;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon,
  description,
  children,
  sectionKey,
  onSave,
  editingSection,
  setEditingSection,
  loading = false,
  saved = false,
  helpText
}) => {
  const isEditing = editingSection === sectionKey;

  return (
    <Card 
      sx={{ 
        mb: 3, 
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: theme => theme.shadows[8]
        },
        border: isEditing ? 2 : 1,
        borderColor: isEditing ? 'primary.main' : 'divider'
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: 2 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 1.5,
              bgcolor: 'primary.main',
              borderRadius: 2,
              color: 'white',
              mr: 2
            }}>
              {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {title}
                </Typography>
                {helpText && (
                  <Tooltip title={helpText} arrow>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpOutline fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {saved && (
                  <Fade in={saved}>
                    <CheckCircle 
                      color="success" 
                      sx={{ ml: 1, fontSize: '1.2rem' }} 
                    />
                  </Fade>
                )}
              </Box>
              {description && (
                <Typography variant="body2" color="textSecondary">
                  {description}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isEditing ? (
              <>
                <Button
                  onClick={onSave}
                  startIcon={<Save />}
                  variant="contained"
                  size="small"
                  disabled={loading}
                  sx={{ minWidth: 80 }}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={() => setEditingSection(null)}
                  startIcon={<Cancel />}
                  variant="outlined"
                  size="small"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setEditingSection(sectionKey)}
                startIcon={<Edit />}
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Edit
              </Button>
            )}
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ 
          opacity: loading ? 0.6 : 1,
          transition: 'opacity 0.2s ease-in-out'
        }}>
          {loading ? (
            <Box>
              <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={40} />
            </Box>
          ) : (
            children
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SettingsSection;