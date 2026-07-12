export function galleryUrl(slug?: string | null) {
  const origin = process.env.GALLERY_URL || process.env.NEXT_PUBLIC_GALLERY_URL || "http://localhost:3002";
  return slug ? `${origin.replace(/\/$/, "")}/gallery/${slug}` : origin;
}
