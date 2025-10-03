import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Stack, Chip, Button, Divider, Paper } from '@mui/material';
import { Whatshot } from '@mui/icons-material';
import communityService, { IPost, IGroup, TrendingResponse } from '../../services/communityService';

const CommunityTrending: React.FC = () => {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        setLoading(true);
        const data = await communityService.getTrending(10);
        setPosts(data.posts || []);
        setGroups(data.groups || []);
      } catch (e) {
        console.error('Failed to load trending', e);
      } finally {
        setLoading(false);
      }
    };
    loadTrending();
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Trending
        </Typography>
        <Typography variant="body1" color="text.secondary">
          See what\'s hot in the community right now
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Typography>Loading trending content...</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Whatshot color="error" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Trending Posts</Typography>
                </Stack>
                {posts.length === 0 ? (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No trending posts yet.</Typography>
                  </Paper>
                ) : (
                  <Stack spacing={2}>
                    {posts.map(post => (
                      <Card key={post.id} variant="outlined">
                        <CardContent>
                          <Stack direction="row" spacing={2}>
                            <Avatar src={post.author.avatar}>
                              {post.author.name.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                            <Box flex={1}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{post.author.name}</Typography>
                                <Chip size="small" label={post.author.role} />
                              </Stack>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>{post.content}</Typography>
                              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">{post.likes} likes</Typography>
                                <Typography variant="caption" color="text.secondary">{post.comments} comments</Typography>
                                <Typography variant="caption" color="text.secondary">{post.shares} shares</Typography>
                              </Stack>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Whatshot color="warning" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Trending Groups</Typography>
                </Stack>
                {groups.length === 0 ? (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No trending groups yet.</Typography>
                  </Paper>
                ) : (
                  <Stack spacing={2}>
                    {groups.map(group => (
                      <Card key={group.id} variant="outlined">
                        <CardContent>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar src={group.avatar}>{group.name[0]}</Avatar>
                            <Box flex={1}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{group.name}</Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>{group.description}</Typography>
                              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">{group.memberCount} members</Typography>
                                {group.isPrivate && <Chip size="small" label="Private" />}
                              </Stack>
                            </Box>
                            <Button size="small" variant="outlined">View</Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default CommunityTrending;


