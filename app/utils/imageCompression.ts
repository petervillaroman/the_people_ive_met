import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file to a target size
 * @param imageFile The original image file
 * @param maxSizeKB The maximum size in kilobytes (default: 300KB)
 * @returns A promise that resolves to the compressed image file
 */
export async function compressImage(imageFile: File, maxSizeKB: number = 300): Promise<File> {
  // Skip compression for non-image files or files already smaller than the target size
  if (!imageFile.type.startsWith('image/') || imageFile.size <= maxSizeKB * 1024) {
    return imageFile;
  }

  console.log('Original image size:', Math.round(imageFile.size / 1024), 'KB');
  
  // Configure compression options
  const options = {
    maxSizeMB: maxSizeKB / 1024, // Convert KB to MB
    maxWidthOrHeight: 1920, // Max dimension (width or height)
    useWebWorker: true,
    fileType: imageFile.type,
  };
  
  try {
    // Compress the image
    const compressedFile = await imageCompression(imageFile, options);
    
    console.log('Compressed image size:', Math.round(compressedFile.size / 1024), 'KB');
    
    // If compression actually made the file larger (rare case), return the original
    if (compressedFile.size > imageFile.size) {
      console.log('Compression increased file size, using original');
      return imageFile;
    }
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return the original file if compression fails
    return imageFile;
  }
} 