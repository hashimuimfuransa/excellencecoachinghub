import React, { useState } from 'react';
import { Avatar, AvatarProps } from '@mui/material';
import { Person } from '@mui/icons-material';
import { imageCacheService } from '../../services/imageCacheService';

interface FallbackAvatarProps extends Omit<AvatarProps, 'src'> {
  src?: string;
  fallbackIcon?: React.ReactNode;
  fallbackText?: string;
}

const FallbackAvatar: React.FC<FallbackAvatarProps> = ({
  src,
  fallbackIcon = <Person />,
  fallbackText,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    console.warn('🖼️ Image failed to load, using fallback:', src);
    setImageError(true);
    if (src) {
      imageCacheService.markImageFailed(src);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (src) {
      imageCacheService.markImageSuccess(src);
    }
  };

  // Get cached URL or original URL
  const imageUrl = src ? imageCacheService.getImageUrl(src) : undefined;

  // If there's no src or image failed to load, show fallback
  if (!imageUrl || imageError) {
    return (
      <Avatar {...props}>
        {fallbackText ? fallbackText.charAt(0).toUpperCase() : fallbackIcon}
      </Avatar>
    );
  }

  return (
    <Avatar
      {...props}
      src={imageLoaded ? imageUrl : undefined}
      imgProps={{
        onError: handleImageError,
        onLoad: handleImageLoad,
        // Add retry mechanism for 429 errors
        onLoadStart: () => {
          // Reset error state when starting to load
          if (imageError) {
            setImageError(false);
          }
        }
      }}
    >
      {/* Show fallback while loading or if image fails */}
      {(!imageLoaded || imageError) && (
        fallbackText ? fallbackText.charAt(0).toUpperCase() : fallbackIcon
      )}
    </Avatar>
  );
};

export default FallbackAvatar;
