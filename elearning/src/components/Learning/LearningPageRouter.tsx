import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import UnifiedLearningPage from '../../pages/Student/UnifiedLearningPage';
import NurseryUnifiedLearningPage from '../../pages/Student/NurseryUnifiedLearningPage';
import { courseService } from '../../services/courseService';

/**
 * Smart router that automatically selects between regular and nursery learning pages
 * based on the course category
 */
const LearningPageRouter: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const [courseCategory, setCourseCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) {
        console.log('[LearningPageRouter] No courseId provided');
        setLoading(false);
        return;
      }

      try {
        console.log('[LearningPageRouter] Loading course with ID:', courseId);
        const course = await courseService.getCourseById(courseId);
        console.log('[LearningPageRouter] Course loaded:', {
          id: course._id,
          title: course.title,
          category: course.category,
          categoryLowercase: course.category?.toLowerCase(),
          nurseryLevel: course.nurseryLevel
        });
        
        // Check if course has nurseryLevel set (indicates it's a nursery/kid-friendly course)
        if (course.nurseryLevel && course.nurseryLevel !== '') {
          console.log('[LearningPageRouter] Detected nursery course via nurseryLevel:', course.nurseryLevel);
          setCourseCategory('nursery');
        } else {
          const category = course.category?.toLowerCase() || '';
          console.log('[LearningPageRouter] Setting category to:', category);
          setCourseCategory(category);
        }
      } catch (error) {
        console.error('[LearningPageRouter] Error loading course:', error);
        setCourseCategory('default');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <CircularProgress sx={{ color: '#fff' }} />
      </Box>
    );
  }

  // Check if course category is nursery or similar kid-friendly categories
  const isNurseryOrKidFriendly = 
    courseCategory === 'nursery' ||
    courseCategory === 'kindergarten' ||
    courseCategory === 'preschool' ||
    courseCategory === 'early-childhood';

  console.log('[LearningPageRouter] Category check:', {
    courseCategory,
    isNurseryOrKidFriendly,
    willRender: isNurseryOrKidFriendly ? 'NurseryUnifiedLearningPage' : 'UnifiedLearningPage'
  });

  // Render the appropriate learning page
  if (isNurseryOrKidFriendly) {
    console.log('[LearningPageRouter] ✅ Rendering NurseryUnifiedLearningPage');
    return <NurseryUnifiedLearningPage />;
  }

  console.log('[LearningPageRouter] ⚠️ Rendering UnifiedLearningPage (not a nursery course)');
  return <UnifiedLearningPage />;
};

export default LearningPageRouter;