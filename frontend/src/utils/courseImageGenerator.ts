// Course image generator utility
// Generates course thumbnails automatically based on course data
import React from 'react';

interface CourseImageOptions {
  title: string;
  category: string;
  instructor?: string;
  width?: number;
  height?: number;
}

// Color schemes for different categories
const categoryColors: Record<string, { primary: string; secondary: string; accent: string }> = {
  'Programming': { primary: '#1976d2', secondary: '#42a5f5', accent: '#e3f2fd' },
  'Design': { primary: '#7b1fa2', secondary: '#ba68c8', accent: '#f3e5f5' },
  'Business': { primary: '#388e3c', secondary: '#66bb6a', accent: '#e8f5e8' },
  'Marketing': { primary: '#f57c00', secondary: '#ffb74d', accent: '#fff3e0' },
  'Science': { primary: '#0288d1', secondary: '#4fc3f7', accent: '#e1f5fe' },
  'Mathematics': { primary: '#5d4037', secondary: '#8d6e63', accent: '#efebe9' },
  'Language': { primary: '#c2185b', secondary: '#f06292', accent: '#fce4ec' },
  'Technology': { primary: '#455a64', secondary: '#78909c', accent: '#eceff1' },
  'Health': { primary: '#00796b', secondary: '#4db6ac', accent: '#e0f2f1' },
  'Arts': { primary: '#8e24aa', secondary: '#ab47bc', accent: '#f8bbd9' },
  'default': { primary: '#424242', secondary: '#757575', accent: '#f5f5f5' }
};

// Category icons (using emoji for simplicity)
const categoryIcons: Record<string, string> = {
  'Programming': '💻',
  'Design': '🎨',
  'Business': '💼',
  'Marketing': '📈',
  'Science': '🔬',
  'Mathematics': '📊',
  'Language': '🗣️',
  'Technology': '⚙️',
  'Health': '🏥',
  'Arts': '🎭',
  'default': '📚'
};

export const generateCourseImage = (options: CourseImageOptions): string => {
  const { title, category, instructor, width = 400, height = 250 } = options;
  
  // Get color scheme for category
  const colors = categoryColors[category] || categoryColors.default;
  const icon = categoryIcons[category] || categoryIcons.default;
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return generateFallbackImage(options);
  }

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(1, colors.secondary);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add overlay pattern
  ctx.fillStyle = colors.accent;
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < width; i += 40) {
    for (let j = 0; j < height; j += 40) {
      ctx.fillRect(i, j, 20, 20);
    }
  }
  ctx.globalAlpha = 1;
  
  // Add category icon
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(icon, width / 2, 80);
  
  // Add course title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  
  // Word wrap for title
  const words = title.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > width - 40 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  
  // Draw title lines
  const startY = height / 2 - (lines.length * 15);
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + (index * 30));
  });
  
  // Add category label
  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(category.toUpperCase(), width / 2, height - 60);
  
  // Add instructor if provided
  if (instructor) {
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`by ${instructor}`, width / 2, height - 30);
  }
  
  return canvas.toDataURL('image/png');
};

// Fallback for when canvas is not available
const generateFallbackImage = (options: CourseImageOptions): string => {
  const { category } = options;
  const colors = categoryColors[category] || categoryColors.default;
  
  // Return a data URL for a simple colored rectangle with SVG
  const svg = `
    <svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="250" fill="url(#grad1)" />
      <text x="200" y="80" font-family="Arial" font-size="48" text-anchor="middle" fill="rgba(255,255,255,0.8)">
        ${categoryIcons[category] || categoryIcons.default}
      </text>
      <text x="200" y="140" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="white">
        ${options.title.length > 30 ? options.title.substring(0, 30) + '...' : options.title}
      </text>
      <text x="200" y="190" font-family="Arial" font-size="16" text-anchor="middle" fill="rgba(255,255,255,0.9)">
        ${category.toUpperCase()}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Hook to use generated course images
export const useCourseImage = (course: { title: string; category: string; instructor?: { firstName?: string; lastName?: string }; thumbnail?: string }) => {
  const [imageUrl, setImageUrl] = React.useState<string>('');
  
  React.useEffect(() => {
    if (course.thumbnail) {
      setImageUrl(course.thumbnail);
    } else {
      const instructorName = course.instructor 
        ? `${course.instructor.firstName || ''} ${course.instructor.lastName || ''}`.trim()
        : undefined;
        
      const generatedImage = generateCourseImage({
        title: course.title,
        category: course.category,
        instructor: instructorName
      });
      
      setImageUrl(generatedImage);
    }
  }, [course]);
  
  return imageUrl;
};

// Utility to get course image URL
export const getCourseImageUrl = (course: { title: string; category: string; instructor?: { firstName?: string; lastName?: string }; thumbnail?: string }): string => {
  if (course.thumbnail) {
    return course.thumbnail;
  }
  
  const instructorName = course.instructor 
    ? `${course.instructor.firstName || ''} ${course.instructor.lastName || ''}`.trim()
    : undefined;
    
  return generateCourseImage({
    title: course.title,
    category: course.category,
    instructor: instructorName
  });
};
