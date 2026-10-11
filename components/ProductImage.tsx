import Image, { type ImageProps } from "next/image";

// Photos uploaded through the admin are served by the API (proxied at
// /uploads/*) and are already stored as the admin supplied them, so they skip
// Next's image optimizer.
export default function ProductImage({ alt, ...props }: ImageProps) {
  const isUpload = typeof props.src === "string" && props.src.startsWith("/uploads/");
  return <Image alt={alt} {...props} unoptimized={isUpload || props.unoptimized} />;
}
