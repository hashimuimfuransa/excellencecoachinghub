// Course image generator utility
export interface CourseImageOptions {
  title: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  instructor?: string;
}

// Predefined color schemes for different categories
const categoryColors: Record<string, { primary: string; secondary: string; accent: string }> = {
  'Web Development': { primary: '#3B82F6', secondary: '#1E40AF', accent: '#60A5FA' },
  'Data Science': { primary: '#10B981', secondary: '#047857', accent: '#34D399' },
  'Design': { primary: '#F59E0B', secondary: '#D97706', accent: '#FBBF24' },
  'Marketing': { primary: '#EF4444', secondary: '#DC2626', accent: '#F87171' },
  'Business': { primary: '#8B5CF6', secondary: '#7C3AED', accent: '#A78BFA' },
  'Programming': { primary: '#06B6D4', secondary: '#0891B2', accent: '#22D3EE' },
  'Mobile Development': { primary: '#EC4899', secondary: '#DB2777', accent: '#F472B6' },
  'default': { primary: '#6B7280', secondary: '#4B5563', accent: '#9CA3AF' }
};

// Level indicators
const levelColors: Record<string, string> = {
  'beginner': '#10B981',
  'intermediate': '#F59E0B',
  'advanced': '#EF4444'
};

// Generate a course thumbnail using Canvas API
export const generateCourseThumbnail = (options: CourseImageOptions): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return generatePlaceholderUrl(options);
  }

  // Set canvas dimensions
  canvas.width = 400;
  canvas.height = 225;

  const colors = categoryColors[options.category] || categoryColors.default;

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(1, colors.secondary);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add geometric pattern overlay
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = colors.accent;
  
  // Draw circles pattern
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 50 + 20;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  // Add category icon/text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(options.category.toUpperCase(), 20, 30);

  // Add level indicator
  const levelColor = levelColors[options.level];
  ctx.fillStyle = levelColor;
  ctx.fillRect(20, 40, 60, 20);
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(options.level.toUpperCase(), 50, 54);

  // Add course title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  
  // Word wrap for title
  const words = options.title.split(' ');
  const maxWidth = canvas.width - 40;
  let line = '';
  let y = canvas.height / 2;
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, canvas.width / 2, y);
      line = words[n] + ' ';
      y += 30;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, canvas.width / 2, y);

  // Add instructor name if provided
  if (options.instructor) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`by ${options.instructor}`, canvas.width / 2, canvas.height - 30);
  }

  // Add decorative elements
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, canvas.height - 60);
  ctx.lineTo(canvas.width - 20, canvas.height - 60);
  ctx.stroke();

  return canvas.toDataURL('image/png');
};

// Fallback to placeholder service if canvas fails
export const generatePlaceholderUrl = (options: CourseImageOptions): string => {
  const colors = categoryColors[options.category] || categoryColors.default;
  const primaryColor = colors.primary.replace('#', '');
  const secondaryColor = colors.secondary.replace('#', '');
  
  // Use a placeholder service with custom colors and text
  const encodedTitle = encodeURIComponent(options.title.substring(0, 30));
  
  return `https://via.placeholder.com/400x225/${primaryColor}/${secondaryColor}?text=${encodedTitle}`;
};

// Get course thumbnail - tries canvas first, falls back to placeholder
export const getCourseThumbnail = (options: CourseImageOptions): string => {
  try {
    return generateCourseThumbnail(options);
  } catch (error) {
    console.warn('Failed to generate canvas thumbnail, using placeholder:', error);
    return generatePlaceholderUrl(options);
  }
};

// Predefined course images for specific categories (optional)
export const getCategoryImage = (category: string): string => {
  const categoryImages: Record<string, string> = {
    'Web Development': '/elearning.webp',
    'Data Science': '/elearning.webp',
    'Design': '/elearning.webp',
    'Marketing': '/elearning.webp',
    'Business': '/elearning.webp',
    'Programming': '/elearning.webp',
    'Mobile Development': '/elearning.webp'
  };

  return categoryImages[category] || '/elearning.webp';
};

// Generate course URL for e-learning platform
export const generateCourseUrl = (courseId: string, baseUrl: string = 'http://localhost:3000'): string => {
  return `${baseUrl}/course/${courseId}`;
};

// Generate enrollment URL for e-learning platform
export const generateEnrollmentUrl = (courseId: string, baseUrl: string = 'http://localhost:3000'): string => {
  return `${baseUrl}/courses?enroll=${courseId}`;
};