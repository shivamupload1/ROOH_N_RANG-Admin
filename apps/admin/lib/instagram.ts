import { prisma } from "@/lib/db";

type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp?: string;
};

export async function syncInstagramPosts() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) throw new Error("INSTAGRAM_ACCESS_TOKEN is not configured.");

  const base = (process.env.INSTAGRAM_API_BASE || "https://graph.instagram.com").replace(/\/$/, "");
  const url = new URL(`${base}/me/media`);
  url.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp");
  url.searchParams.set("limit", "3");
  url.searchParams.set("access_token", token);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Instagram sync failed (${response.status}).`);
  const payload = await response.json() as { data?: InstagramMedia[] };
  const posts = payload.data || [];

  await prisma.$transaction([
    prisma.instagramPost.updateMany({ data: { isActive: false } }),
    ...posts.map((post) => prisma.instagramPost.upsert({
      where: { id: post.id },
      update: {
        permalink: post.permalink,
        mediaType: post.media_type,
        mediaUrl: post.media_url || null,
        thumbnailUrl: post.thumbnail_url || null,
        caption: post.caption || null,
        postedAt: post.timestamp ? new Date(post.timestamp) : null,
        isActive: true,
        syncedAt: new Date()
      },
      create: {
        id: post.id,
        permalink: post.permalink,
        mediaType: post.media_type,
        mediaUrl: post.media_url || null,
        thumbnailUrl: post.thumbnail_url || null,
        caption: post.caption || null,
        postedAt: post.timestamp ? new Date(post.timestamp) : null,
        isActive: true
      }
    }))
  ]);

  return { synced: posts.length };
}
