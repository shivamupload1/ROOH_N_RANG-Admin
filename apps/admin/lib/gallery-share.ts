import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/slug";

const EVENT_KEY_PREFIX = "galleryShare:event:";
const CODE_KEY_PREFIX = "galleryShare:code:";

type GalleryShareValue = {
  code: string;
  eventId: string;
};

function parseShareValue(value: unknown): GalleryShareValue | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const code = typeof record.code === "string" ? record.code : "";
  const eventId = typeof record.eventId === "string" ? record.eventId : "";

  return code && eventId ? { code, eventId } : null;
}

function createShareCode() {
  let code = "";

  while (code.length < 10) {
    code += randomBytes(8).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  return code.slice(0, 10);
}

export async function getGalleryShareCode(eventId: string) {
  const record = await prisma.settings.findUnique({
    where: { key: `${EVENT_KEY_PREFIX}${eventId}` },
    select: { value: true }
  });

  return parseShareValue(record?.value)?.code || null;
}

export async function ensureGalleryShareCode(eventId: string) {
  const existingCode = await getGalleryShareCode(eventId);

  if (existingCode) {
    await prisma.settings.upsert({
      where: { key: `${CODE_KEY_PREFIX}${existingCode}` },
      update: { value: { code: existingCode, eventId } },
      create: { key: `${CODE_KEY_PREFIX}${existingCode}`, value: { code: existingCode, eventId } }
    });
    return existingCode;
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = createShareCode();
    const codeKey = `${CODE_KEY_PREFIX}${code}`;
    const collision = await prisma.settings.findUnique({ where: { key: codeKey }, select: { id: true } });

    if (collision) {
      continue;
    }

    const value = { code, eventId };
    await prisma.$transaction([
      prisma.settings.upsert({
        where: { key: `${EVENT_KEY_PREFIX}${eventId}` },
        update: { value },
        create: { key: `${EVENT_KEY_PREFIX}${eventId}`, value }
      }),
      prisma.settings.create({ data: { key: codeKey, value } })
    ]);
    return code;
  }

  throw new Error("Could not create a unique gallery share link.");
}

export function buildGallerySharePath(input: {
  clientName: string;
  eventDate?: Date | null;
  shareCode: string;
}) {
  const clientSegment = generateSlug(input.clientName) || "client";
  const dateSegment = input.eventDate ? input.eventDate.toISOString().slice(0, 10) : "undated";
  return `/${clientSegment}/${dateSegment}/${input.shareCode}`;
}

export function buildGalleryShareUrl(domain: string, path: string) {
  return `${domain.replace(/\/$/, "")}${path}`;
}
