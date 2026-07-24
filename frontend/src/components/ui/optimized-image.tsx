import Image from 'next/image';
import { fixUploadUrl } from '@/lib/utils';

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function OptimizedImage({ src, alt, className, fallback }: OptimizedImageProps) {
  const url = fixUploadUrl(src);
  if (!url) return <>{fallback}</>;
  
  return (
    <Image
      src={url}
      alt={alt}
      fill
      className={`object-cover ${className || ''}`}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
