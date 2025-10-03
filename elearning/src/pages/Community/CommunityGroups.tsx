import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Stack,
  Chip,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  Add,
  Group,
  Share,
  Chat,
  Settings,
  PersonAdd,
  PersonRemove,
  ContentCopy,
  Link,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import communityService from '../../services/communityService';

// Styled Components
const GroupCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('sm')]: {
    borderRadius: theme.spacing(1.5),
    minHeight: 'auto',
  },
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
    [theme.breakpoints.down('sm')]: {
      transform: 'none', // Disable hover effects on mobile
      boxShadow: theme.shadows[2],
    },
  },
}));

const CreateGroupCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 300,
  [theme.breakpoints.down('sm')]: {
    borderRadius: theme.spacing(1.5),
    minHeight: 200,
    padding: theme.spacing(2),
  },
  [theme.breakpoints.up('md')]: {
    minHeight: 350,
  },
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    [theme.breakpoints.down('sm')]: {
      backgroundColor: alpha(theme.palette.primary.main, 0.02),
    },
  },
}));

// Interfaces
interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar?: string;
  coverImage?: string;
  memberCount: number;
  maxMembers?: number;
  isPrivate: boolean;
  isJoined: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  createdAt: string;
  lastActivity: string;
  tags: string[];
  rules: string[];
  joinCode?: string;
}

interface CommunityGroupsProps {}

const CommunityGroups: React.FC<CommunityGroupsProps> = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [manageGroupOpen, setManageGroupOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    category: '',
    isPrivate: false,
    tags: [] as string[],
  });

  // Load groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        
        // Fetch real groups from API
        const groupsResponse = await communityService.getGroups();
        console.log('Groups response:', groupsResponse);
        
        // Handle different response structures
        if (groupsResponse && groupsResponse.data && groupsResponse.data.groups) {
          // Response from new backend API
          setGroups(groupsResponse.data.groups);
        } else if (groupsResponse && groupsResponse.groups) {
          // Response from existing API
          setGroups(groupsResponse.groups);
        } else {
          // Fallback to empty array or mock data for testing
          setGroups([]);
          
          // Optional: Show a message that API is not available
          console.warn('Groups API not available, showing empty state');
        }

        // Fetch user's groups
        try {
          const myGroupsResp = await communityService.getMyGroups();
          console.log('My groups response:', myGroupsResp);
          
          if (myGroupsResp && myGroupsResp.data) {
            setMyGroups(myGroupsResp.data);
          } else if (Array.isArray(myGroupsResp)) {
            setMyGroups(myGroupsResp);
          } else {
            setMyGroups([]);
          }
        } catch (myGroupsError) {
          console.error('Error loading my groups:', myGroupsError);
          setMyGroups([]);
        }

        console.log('Groups loaded successfully');
      } catch (error) {
        console.error('Error loading groups:', error);
        // Set empty arrays on error to prevent crashes
        setGroups([]);
        setMyGroups([]);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  // Group creation handler
  const handleCreateGroup = async () => {
    try {
      const createdGroup = await communityService.createGroup({
        name: newGroup.name,
        description: newGroup.description,
        category: newGroup.category,
        isPrivate: newGroup.isPrivate,
        tags: newGroup.tags
      });

      // Add created group to user's groups and all groups
      setMyGroups(prev => [createdGroup, ...prev]);
      setGroups(prev => [createdGroup, ...prev]);
      
      // Reset form and close dialog
      setNewGroup({
        name: '',
        description: '',
        category: '',
        isPrivate: false,
        tags: []
      });
      setCreateGroupOpen(false);

      console.log('Group created successfully:', createdGroup);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    }
  };

  // Group join/leave handler
  const handleGroupToggle = async (group: Group) => {
    try {
      if (group.isJoined) {
        await communityService.leaveGroup(group.id);
        // Update group in lists
        setGroups(prev => prev.map(g => 
          g.id === group.id ? { ...g, isJoined: false } : g
        ));
        setMyGroups(prev => prev.filter(g => g.id !== group.id));
      } else {
        await communityService.joinGroup(group.id);
        // Update group in lists
        setGroups(prev => prev.map(g => 
          g.id === group.id ? { ...g, isJoined: true } : g
        ));
        setMyGroups(prev => [{ ...group, isJoined: true }, ...prev]);
      }
    } catch (error) {
      console.error('Error toggling group:', error);
      alert('Failed to update group membership. Please try again.');
    }
  };

  // Group chat creation
  const handleOpenGroupChat = async (group: Group) => {
    try {
      // Create group chat using the new endpoint
      const chatData = await communityService.createGroupChat(group.id);
      console.log('Group chat created:', chatData);
      
      // Show success message
      alert(`Group chat for "${group.name}" is ready! You can now communicate with ${chatData.participants || 0} members.`);
      
      // In a real implementation, you might navigate to the chat:
      // window.location.href = `/community/chat?chatId=${chatData.chatId}`;
    } catch (error: any) {
      console.error('Error creating group chat:', error);
      
      // Better error handling
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create group chat. Please try again.';
      
      if (error.response?.status === 403) {
        alert('Access denied. Only group admins or moderators can create group chats.');
      } else if (error.response?.status === 400) {
        alert('Group chat already exists for this group.');
      } else {
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  // View group members (admin/moderator only)
  const handleViewMembers = async (group: Group) => {
    try {
      const membersData = await communityService.getGroupMembers(group.id);
      setSelectedGroup(group);
      setGroupMembers(membersData.members || []);
      setManageGroupOpen(true);
      console.log('Group members loaded:', membersData);
    } catch (error: any) {
      console.error('Error fetching group members:', error);
      
      if (error.response?.status === 403) {
        alert('Access denied. Only group admins or moderators can view members.');
      } else {
        alert('Failed to load group members. Please try again.');
      }
    }
  };

  // Generate new join code for group
  const handleGenerateNewLink = async (group: Group) => {
    if (!group.isAdmin) {
      alert('Only group admins can generate join codes.');
      return;
    }

    try {
      const data = await communityService.generateJoinCode(group.id);
      
      // Update local group state with new join code
      setGroups(prev => prev.map(g => 
        g.id === group.id ? { ...g, joinCode: data.joinCode } : g
      ));
      setMyGroups(prev => prev.map(g => 
        g.id === group.id ? { ...g, joinCode: data.joinCode } : g
      ));
      
      // Update the group object
      group.joinCode = data.joinCode;
      
      // Automatically share the new link
      await handleShareLink(group);
      
    } catch (error: any) {
      console.error('Error generating join code:', error);
      alert(error.response?.data?.message || 'Failed to generate new join code.');
    }
  };

  // Share join link
  const handleShareLink = async (group: Group) => {
    try {
      // Ensure join code exists
      if (!group.joinCode) {
        alert('Generating join link... Please wait.');
        
        // Refresh group data to get join code
        const response = await communityService.getMyGroups();
        const updatedGroup = response.find(g => g.id === group.id);
        
        if (!updatedGroup?.joinCode) {
          alert('Unable to generate join link. Please try again.');
          return;
        }
        
        group.joinCode = updatedGroup.joinCode;
      }

      const joinLink = `${window.location.origin}/community/groups/join/${group.joinCode}`;
      
      // Try native sharing first
      if (navigator.share && navigator.canShare) {
        try {
          await navigator.share({
            title: `Join ${group.name} on Excellence Coaching Hub`,
            text: `Join "${group.name}" group! Click the link to become a member and connect with other learners.`,
            url: joinLink
          });
          return;
        } catch (shareErr) {
          // Fall through to clipboard method
          console.log('Native sharing cancelled or failed:', shareErr);
        }
      }
      
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(joinLink);
        
        // Show better success message with link preview
        const message = `✅ Join link copied!\n\nShare this link:\n${joinLink}\n\nAnyone with this link can join "${group.name}".`;
        alert(message);
      } catch (clipboardErr) {
        // Manual fallback - show link in an alert
        alert(`📋 Share this link to invite others:\n\n${joinLink}\n\nGroup: ${group.name}\n\nCopy and paste this link to share with friends!`);
      }
      
    } catch (error) {
      console.error('Error sharing group link:', error);
      alert('Failed to generate share link. Please try again later.');
    }
  };

  // Copy join code only (simpler option)
  const handleCopyJoinCode = async (group: Group) => {
    try {
      if (!group.joinCode) {
        alert('Generating join code... Please wait.');
        
        // Refresh group data to get join code
        const response = await communityService.getMyGroups();
        const updatedGroup = response.find(g => g.id === group.id);
        
        if (!updatedGroup?.joinCode) {
          alert('Unable to generate join code. Please try again.');
          return;
        }
        
        group.joinCode = updatedGroup.joinCode;
      }

      await navigator.clipboard.writeText(group.joinCode);
      alert(`✅ Join code copied: ${group.joinCode}\n\nShare this code with friends to let them join "${group.name}".`);
      
    } catch (error) {
      console.error('Error copying join code:', error);
      alert(`📋 Join code for "${group.name}": ${group.joinCode}\n\nShare this code with friends!`);
    }
  };

  // Delete group (admin only)
  const handleDeleteGroup = async (group: Group) => {
    if (!group.isAdmin) {
      alert('Only the group creator can delete the group.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${group.name}"? This action cannot be undone and will remove all members and chats.`
    );

    if (!confirmed) return;

    try {
      await communityService.deleteGroup(group.id);
      
      // Remove from local state
      setGroups(prev => prev.filter(g => g.id !== group.id));
      setMyGroups(prev => prev.filter(g => g.id !== group.id));
      
      alert(`Group "${group.name}" has been deleted successfully.`);
    } catch (error: any) {
      console.error('Error deleting group:', error);
      alert(error.response?.data?.message || 'Failed to delete group. Please try again.');
    }
  };

  // Open settings dialog
  const handleOpenSettings = (group: Group) => {
    setEditingGroup(group);
    setSettingsOpen(true);
  };

  // Save group settings
  const handleSaveSettings = async () => {
    if (!editingGroup) return;

    try {
      const updatedGroup = await communityService.updateGroupSettings(editingGroup.id, {
        name: editingGroup.name,
        description: editingGroup.description,
        category: editingGroup.category,
        isPrivate: editingGroup.isPrivate,
        tags: editingGroup.tags,
        maxMembers: editingGroup.maxMembers
      });

      // Update local state
      setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
      setMyGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
      
      setSettingsOpen(false);
      setEditingGroup(null);
      alert('Group settings updated successfully!');
    } catch (error: any) {
      console.error('Error updating group settings:', error);
      alert(error.response?.data?.message || 'Failed to update group settings. Please try again.');
    }
  };

  // Change member role
  const handleChangeMemberRole = async (memberId: string, newRole: string) => {
    if (!selectedGroup) return;

    try {
      await communityService.updateMemberRole(selectedGroup.id, memberId, newRole);
      
      // Reload members
      const membersData = await communityService.getGroupMembers(selectedGroup.id);
      setGroupMembers(membersData.members || []);
      
      alert(`Member role updated to ${newRole} successfully!`);
    } catch (error: any) {
      console.error('Error updating member role:', error);
      alert(error.response?.data?.message || 'Failed to update member role.');
    }
  };

  // Remove member from group
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!selectedGroup) return;

    const confirmed = window.confirm(`Are you sure you want to remove ${memberName} from the group?`);
    if (!confirmed) return;

    try {
      await communityService.removeMember(selectedGroup.id, memberId);
      
      // Reload members
      const membersData = await communityService.getGroupMembers(selectedGroup.id);
      setGroupMembers(membersData.members || []);
      
      alert(`${memberName} has been removed from the group.`);
    } catch (error: any) {
      console.error('Error removing member:', error);
      alert(error.response?.data?.message || 'Failed to remove member.');
    }
  };

  // Render group card component
  const renderGroupCard = (group: Group) => {
    if (!group) return null;
    
    return (
      <GroupCard>
        <CardContent>
          {/* Group Header */}
                 <Box sx={{ 
                   display: 'flex', 
                   alignItems: 'center', 
                   mb: { xs: 2, sm: 2 },
                   flexDirection: { xs: 'column', sm: 'row' },
                   textAlign: { xs: 'center', sm: 'left' }
                 }}>
                   <Avatar
                     src={group.avatar}
                     sx={{
                       width: { xs: 56, sm: 48 },
                       height: { xs: 56, sm: 48 },
                       mb: { xs: 1, sm: 0 },
                       mr: { xs: 0, sm: 2 },
                       background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)'
                     }}
                   >
                     {group.name?.charAt(0)?.toUpperCase() || 'G'}
                   </Avatar>
                   <Box sx={{ flex: 1 }}>
                     <Typography 
                       variant="h6" 
                       sx={{ 
                         fontWeight: 600,
                         fontSize: { xs: '1.125rem', sm: '1.25rem' }
                       }}
                     >
                       {group.name || 'Untitled Group'}
                     </Typography>
                     <Typography 
                       variant="body2" 
                       color="text.secondary"
                       sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}
                     >
                       {group.category || 'Other'} • {group.memberCount || 0} members
                     </Typography>
                   </Box>
                 </Box>

          {/* Group Description */}
          <Typography variant="body2" sx={{ mb: 2, minHeight: 40 }}>
            {group.description || 'No description available.'}
          </Typography>

          {/* Tags */}
                 <Box sx={{ mb: 2 }}>
                   {(group.tags || []).slice(0, 3).map((tag) => (
                     <Chip
                       key={tag}
                       label={tag}
                       size="small"
                       sx={{ mr: 0.5, mb: 0.5 }}
                     />
                   ))}
                   {(group.tags || []).length > 3 && (
                     <Chip
                       label={`+${(group.tags || []).length - 3} more`}
                       size="small"
                       variant="outlined"
                       sx={{ mr: 0.5, mb: 0.5 }}
                     />
                   )}
                 </Box>

                 {(group.isAdmin || group.isModerator) && group.joinCode && (
                   <Box sx={{ mb: 2, p: 1, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1, fontSize: '0.75rem' }}>
                     <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                       <Link style={{ fontSize: '12px' }} />
                       Join Code: <strong>{group.joinCode?.substring(0, 8) || ''}...</strong>
                     </Typography>
                   </Box>
                 )}

          {/* Group Actions */}
                 <Stack 
                   spacing={{ xs: 1.5, sm: 1 }} 
                   direction={{ xs: 'column', sm: 'column' }}
                   sx={{ mt: 'auto' }}
                 >
                   {group.isJoined ? (
                     <>
                       <Button
                         variant="contained"
                         startIcon={<Chat />}
                         fullWidth
                         onClick={() => handleOpenGroupChat(group)}
                         disabled={!group.isAdmin && !group.isModerator}
                         size="medium"
                         sx={{ 
                           fontSize: { xs: '0.875rem', sm: '1rem' },
                           py: { xs: 1.5, sm: 1 }
                         }}
                       >
                         {group.isAdmin || group.isModerator ? 'Open Chat' : 'View Chat'}
                       </Button>
                       
                       {(group.isAdmin || group.isModerator) && (
                         <>
                           <Button
                             variant="outlined"
                             startIcon={<Group />}
                             onClick={() => handleViewMembers(group)}
                             size="small"
                             sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                           >
                             <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>View Members ({group.memberCount || 0})</Box>
                             <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Members ({group.memberCount || 0})</Box>
                           </Button>
                           <Stack 
                             direction={{ xs: 'row', sm: 'column' }} 
                             spacing={{ xs: 1, sm: 1 }}
                           >
                             <Button
                               variant="outlined"
                               color="primary"
                               startIcon={<Share />}
                               onClick={() => handleShareLink(group)}
                               size="small"
                               sx={{ 
                                 fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                 flex: { xs: 1, sm: 'unset' }
                               }}
                             >
                               <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Share Join Link</Box>
                               <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Share</Box>
                             </Button>
                             <Button
                               variant="outlined"
                               size="small"
                               startIcon={<ContentCopy />}
                               onClick={() => handleCopyJoinCode(group)}
                               sx={{ 
                                 fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                 flex: { xs: 1, sm: 'unset' }
                               }}
                             >
                               <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Copy Code</Box>
                               <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Code</Box>
                             </Button>
                           </Stack>
                           {group.isAdmin && (
                             <Button
                               variant="outlined"
                               size="small"
                               color="primary"
                               startIcon={<Refresh />}
                               onClick={() => handleGenerateNewLink(group)}
                               sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                             >
                               <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>New Link</Box>
                               <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Refresh</Box>
                             </Button>
                           )}
                         </>
                       )}
                       
                       {group.isAdmin && (
                         <Stack 
                           direction={{ xs: 'row', sm: 'column' }} 
                           spacing={{ xs: 1, sm: 1 }}
                         >
                           <Button
                             variant="outlined"
                             startIcon={<Settings />}
                             onClick={() => handleOpenSettings(group)}
                             size="small"
                             sx={{ 
                               fontSize: { xs: '0.75rem', sm: '0.875rem' },
                               flex: { xs: 1, sm: 'unset' }
                             }}
                           >
                             <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Group Settings</Box>
                             <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Settings</Box>
                           </Button>
                           <Button
                             variant="outlined"
                             color="error"
                             onClick={() => handleDeleteGroup(group)}
                             size="small"
                             sx={{ 
                               fontSize: { xs: '0.75rem', sm: '0.875rem' },
                               flex: { xs: 1, sm: 'unset' }
                             }}
                           >
                             
                             <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Delete Group</Box>
                             <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Delete</Box>
                           </Button>
                         </Stack>
                       )}
                       
                       {!group.isAdmin && (
                         <Button
                           variant="outlined"
                           color="error"
                           startIcon={<PersonRemove />}
                           onClick={() => handleGroupToggle(group)}
                           size="small"
                           sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                         >
                           Leave Group
                         </Button>
                       )}
                     </>
                   ) : (
                     <Button
                       variant="contained"
                       startIcon={<PersonAdd />}
                       fullWidth
                       onClick={() => handleGroupToggle(group)}
                       size="medium"
                       sx={{ 
                         fontSize: { xs: '0.875rem', sm: '1rem' },
                         py: { xs: 1.5, sm: 1 }
                       }}
                     >
                       Join Group
                     </Button>
                   )}
                 </Stack>
        </CardContent>
      </GroupCard>
    );
  };

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 }, 
      maxWidth: 1200, 
      mx: 'auto',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          spacing={{ xs: 2, sm: 0 }}
          sx={{ mb: 2 }}
        >
          <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, width: '100%' }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2.125rem' }
              }}
            >
              Groups
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Join communities, create study groups, and connect with like-minded learners
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateGroupOpen(true)}
            size="medium"
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: 140 }
            }}
          >
            Create Group
          </Button>
        </Stack>

        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              fontSize: { xs: '0.875rem', sm: '1rem' },
              minHeight: { xs: 48, sm: 56 },
              px: { xs: 1, sm: 2 },
              fontWeight: 600
            }
          }}
        >
          <Tab label="All Groups" />
          <Tab label="My Groups" />
        </Tabs>
      </Box>

      {/* Groups Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={{ xs: 3, sm: 4 }}>
          <Typography color="text.secondary">Loading groups...</Typography>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {activeTab === 0 && (
            <>
              {/* Create Group Card */}
              <Grid item xs={12} sm={6} md={4}>
                <CreateGroupCard onClick={() => setCreateGroupOpen(true)}>
                  <CardContent sx={{ 
                    textAlign: 'center', 
                    py: { xs: 2, sm: 3, md: 4 },
                    px: { xs: 2, sm: 3 }
                  }}>
                    <Add sx={{ 
                      fontSize: { xs: 36, sm: 44, md: 48 }, 
                      color: 'primary.main', 
                      mb: { xs: 1.5, sm: 2 } 
                    }} />
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        mb: 1,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }}
                    >
                      Create New Group
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        px: { xs: 1, sm: 0 }
                      }}
                    >
                      Start your own community and bring learners together
                    </Typography>
                  </CardContent>
                </CreateGroupCard>
              </Grid>
              
              {/* All Groups */}
              {(groups || []).length === 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ 
                    p: { xs: 3, sm: 4, md: 6 }, 
                    textAlign: 'center' 
                  }}>
                    <Group sx={{ 
                      fontSize: { xs: 60, sm: 70, md: 80 }, 
                      color: 'text.secondary', 
                      opacity: 0.5, 
                      mb: 2 
                    }} />
                    <Typography 
                      variant="h6" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    >
                      No groups available yet
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 3,
                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                        px: { xs: 2, sm: 0 }
                      }}
                    >
                      Be the first to create a group or check back later when groups are added
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => setCreateGroupOpen(true)}
                      size="medium"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      Create First Group
                    </Button>
                  </Paper>
                </Grid>
              ) : (
                (groups || []).map((group) => (
                  <Grid item xs={12} sm={6} md={4} key={group.id}>
                    {renderGroupCard(group)}
                  </Grid>
                ))
              )}
            </>
          )}
          
          {activeTab === 1 && (
            <>
              {/* My Groups */}
              {(myGroups || []).length === 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ 
                    p: { xs: 3, sm: 4, md: 6 }, 
                    textAlign: 'center' 
                  }}>
                    <Group sx={{ 
                      fontSize: { xs: 60, sm: 70, md: 80 }, 
                      color: 'text.secondary', 
                      opacity: 0.5, 
                      mb: 2 
                    }} />
                    <Typography 
                      variant="h6" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    >
                      You haven't joined any groups yet
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 3,
                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                        px: { xs: 2, sm: 0 }
                      }}
                    >
                      Explore groups and join communities that interest you
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => setActiveTab(0)}
                      size="medium"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      Browse Groups
                    </Button>
                  </Paper>
                </Grid>
              ) : (
                (myGroups || []).map((group) => (
                  <Grid item xs={12} sm={6} md={4} key={group.id}>
                    {renderGroupCard(group)}
                  </Grid>
                ))
              )}
            </>
          )}
        </Grid>
      )}

      {/* Create Group Dialog */}
      <Dialog 
        open={createGroupOpen} 
        onClose={() => setCreateGroupOpen(false)} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: '16px', sm: '32px' },
            maxHeight: { xs: 'calc(100vh - 32px)', sm: 'calc(100vh - 64px)' }
          }
        }}
      >
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Group Name"
              value={newGroup.name}
              onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={newGroup.description}
              onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={newGroup.category}
                onChange={(e) => setNewGroup(prev => ({ ...prev, category: e.target.value }))}
                label="Category"
              >
                <MenuItem value="Programming">Programming</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Business">Business</MenuItem>
                <MenuItem value="Science">Science</MenuItem>
                <MenuItem value="Engineering">Engineering</MenuItem>
                <MenuItem value="Health">Health</MenuItem>
                <MenuItem value="Arts">Arts</MenuItem>
                <MenuItem value="Education">Education</MenuItem>
                <MenuItem value="Technology">Technology</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateGroupOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateGroup}
            variant="contained"
            disabled={!newGroup.name || !newGroup.description || !newGroup.category}
          >
            Create Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Members Management Dialog */}
      <Dialog 
        open={manageGroupOpen} 
        onClose={() => setManageGroupOpen(false)} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: '16px', sm: '32px' },
            maxHeight: { xs: 'calc(100vh - 32px)', sm: 'calc(100vh - 64px)' }
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
          pb: { xs: 1, sm: 2 }
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 0.5, sm: 1 }
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' },
                fontWeight: 600 
              }}
            >
              {selectedGroup ? selectedGroup.name : 'Group'}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                mt: { xs: 0, sm: 0 }
              }}
            >
              Members
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ 
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 }
        }}>
          {groupMembers.length > 0 ? (
            <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mt: 1 }}>
              {groupMembers.map((member) => (
                <Grid item xs={12} key={member.id}>
                  <Paper sx={{ 
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: { xs: 1, sm: 2 }
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: { xs: 1.5, sm: 2 }, 
                      mb: selectedGroup?.isAdmin ? { xs: 1.5, sm: 2 } : 0,
                      flexDirection: { xs: 'column', sm: 'row' },
                      textAlign: { xs: 'center', sm: 'left' }
                    }}>
                      <Avatar 
                        src={member.avatar} 
                        sx={{ 
                          width: { xs: 48, sm: 40 },
                          height: { xs: 48, sm: 40 }
                        }}
                      />
                      <Box sx={{ 
                        flex: 1,
                        minWidth: 0,
                        textAlign: { xs: 'center', sm: 'left' }
                      }}>
                        <Typography 
                          variant="subtitle2"
                          sx={{ 
                            fontSize: { xs: '1rem', sm: '0.875rem' },
                            fontWeight: 600,
                            mb: { xs: 0.5, sm: 0 }
                          }}
                        >
                          {member.name}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.75rem' },
                            display: 'block',
                            mb: { xs: 0.5, sm: 0 }
                          }}
                        >
                          {member.email}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          display="block" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.75rem' }
                          }}
                        >
                          Joined: {new Date(member.joinedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip 
                        label={member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        color={member.role === 'admin' ? 'primary' : member.role === 'moderator' ? 'secondary' : 'default'}
                        size="small"
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.75rem' },
                          height: { xs: 28, sm: 24 },
                          minWidth: { xs: 80, sm: 60 }
                        }}
                      />
                    </Box>
                    
                    {selectedGroup?.isAdmin && member.id !== user?.id && (
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        spacing={{ xs: 1.5, sm: 1 }}
                        sx={{ 
                          mt: { xs: 2, sm: 1 },
                          pt: 1,
                          borderTop: '1px solid',
                          borderColor: 'divider'
                        }}
                        alignItems={{ xs: 'center', sm: 'flex-start' }}
                      >
                        <FormControl 
                          size="small" 
                          sx={{ 
                            minWidth: { xs: '100%', sm: 150 },
                            maxWidth: { xs: '100%', sm: 200 }
                          }}
                        >
                          <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>Change Role</InputLabel>
                          <Select
                            value={member.role}
                            onChange={(e) => handleChangeMemberRole(member.id, e.target.value)}
                            label="Change Role"
                            sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}
                          >
                            <MenuItem value="member" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>Member</MenuItem>
                            <MenuItem value="moderator" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>Moderator</MenuItem>
                            <MenuItem value="admin" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>Admin</MenuItem>
                          </Select>
                        </FormControl>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          sx={{ 
                            fontSize: { xs: '0.875rem', sm: '0.875rem' },
                            minWidth: { xs: 120, sm: 'auto' },
                            width: { xs: '100%', sm: 'auto' }
                          }}
                        >
                          Remove Member
                        </Button>
                      </Stack>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: { xs: 3, sm: 4 },
              px: { xs: 2, sm: 0 },
              minHeight: { xs: 200, sm: 300 }
            }}>
              <Typography 
                variant="h6" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  fontWeight: 600,
                  mb: 1
                }}
              >
                No members found
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  lineHeight: 1.6
                }}
              >
                Unable to load group members information
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1.5, sm: 1 },
          alignItems: { xs: 'stretch', sm: 'center' }
        }}>
          <Button 
            onClick={() => setManageGroupOpen(false)}
            sx={{ 
              order: { xs: 2, sm: 0 },
              fontSize: { xs: '0.875rem', sm: '0.875rem' }
            }}
          >
            Close
          </Button>
          {selectedGroup && (selectedGroup.isAdmin || selectedGroup.isModerator) && (
            <>
              <Button 
                variant="outlined"
                size="small"
                onClick={() => handleCopyJoinCode(selectedGroup)}
                startIcon={<ContentCopy />}
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Copy Code</Box>
                <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Copy</Box>
              </Button>
              {selectedGroup.isAdmin && (
                <Button 
                  variant="outlined"
                  size="small"
                  color="primary"
                  onClick={() => handleGenerateNewLink(selectedGroup)}
                  startIcon={<Refresh />}
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '0.875rem' },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>New Link</Box>
                  <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Refresh</Box>
                </Button>
              )}
              <Button 
                variant="contained" 
                size="small"
                onClick={() => handleShareLink(selectedGroup)}
                startIcon={<Share />}
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  width: { xs: '100%', sm: 'auto' },
                  order: { xs: 1, sm: 0 }
                }}
              >
                <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Share Link</Box>
                <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Share</Box>
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Group Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Group Settings</DialogTitle>
        <DialogContent>
          {editingGroup && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Group Name"
                value={editingGroup.name}
                onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={editingGroup.description}
                onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={editingGroup.category}
                  onChange={(e) => setEditingGroup({ ...editingGroup, category: e.target.value })}
                  label="Category"
                >
                  <MenuItem value="Programming">Programming</MenuItem>
                  <MenuItem value="Design">Design</MenuItem>
                  <MenuItem value="Business">Business</MenuItem>
                  <MenuItem value="Science">Science</MenuItem>
                  <MenuItem value="Engineering">Engineering</MenuItem>
                  <MenuItem value="Health">Health</MenuItem>
                  <MenuItem value="Arts">Arts</MenuItem>
                  <MenuItem value="Education">Education</MenuItem>
                  <MenuItem value="Technology">Technology</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                type="number"
                label="Max Members"
                value={editingGroup.maxMembers || 500}
                onChange={(e) => setEditingGroup({ ...editingGroup, maxMembers: parseInt(e.target.value) })}
                sx={{ mb: 2 }}
                InputProps={{ inputProps: { min: editingGroup.memberCount, max: 2000 } }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Private Group:</Typography>
                <Button
                  variant={editingGroup.isPrivate ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setEditingGroup({ ...editingGroup, isPrivate: !editingGroup.isPrivate })}
                >
                  {editingGroup.isPrivate ? 'Yes' : 'No'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveSettings}
            variant="contained"
            disabled={!editingGroup?.name || !editingGroup?.description}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityGroups;