"use server";

import { InquiryStatus, MediaType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminSession, hashSecret, requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { eventCoverKey } from "@/lib/event-cover";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import {
  albumSchema,
  clientGallerySchema,
  clientSchema,
  driveAccountSchema,
  eventSchema,
  importDriveFolderSchema,
  mediaFileSchema,
  studioSettingsSchema,
  websiteContentSchema
} from "@/lib/validators";
import { createFolder, importFilesFromFolder, syncEventGalleryFromDrive } from "@/lib/google-drive";
import { processPreviewBatch } from "@/lib/preview-pipeline";
import { ensureGalleryShareCode } from "@/lib/gallery-share";

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

function textOrNull(value?: string | null) {
  return value && value.length > 0 ? value : null;
}

function dateOrNull(value?: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function expiryFromOption(option: "30" | "90" | "none") {
  if (option === "none") {
    return null;
  }

  const date = new Date();
  date.setDate(date.getDate() + Number(option));
  return date;
}

function eventDriveRedirectPath(id: string, query?: Record<string, string>) {
  const search = new URLSearchParams(query);
  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  return `/admin/events/${id}${suffix}`;
}

function clientWorkspaceRedirectPath(id: string, query?: Record<string, string>) {
  const search = new URLSearchParams(query);
  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  return `/admin/clients/${id}${suffix}`;
}

async function eventSlug(input: { name: string; slug?: string | null; currentEventId?: string }) {
  const baseSlug = generateSlug(input.slug || input.name) || generateSlug(input.name);

  return ensureUniqueSlug(baseSlug, async (slug) => {
    const existing = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
    return Boolean(existing && existing.id !== input.currentEventId);
  });
}

async function albumSlug(input: { eventId: string; name: string; slug?: string | null; currentAlbumId?: string }) {
  const baseSlug = generateSlug(input.slug || input.name) || generateSlug(input.name);

  return ensureUniqueSlug(baseSlug, async (slug) => {
    const existing = await prisma.album.findUnique({
      where: { eventId_slug: { eventId: input.eventId, slug } },
      select: { id: true }
    });
    return Boolean(existing && existing.id !== input.currentAlbumId);
  });
}

export async function createClientAction(formData: FormData) {
  await requireAdminSession();
  const parsed = clientSchema.parse(Object.fromEntries(formData));

  const client = await prisma.client.create({
    data: {
      name: parsed.name,
      email: textOrNull(parsed.email),
      phone: textOrNull(parsed.phone),
      city: textOrNull(parsed.city),
      notes: textOrNull(parsed.notes)
    }
  });

  revalidatePath("/admin/clients");
  redirect(clientWorkspaceRedirectPath(client.id, { setup: "client-created" }));
}

export async function updateClientAction(id: string, formData: FormData) {
  await requireAdminSession();
  const parsed = clientSchema.parse(Object.fromEntries(formData));

  await prisma.client.update({
    where: { id },
    data: {
      name: parsed.name,
      email: textOrNull(parsed.email),
      phone: textOrNull(parsed.phone),
      city: textOrNull(parsed.city),
      notes: textOrNull(parsed.notes)
    }
  });

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  redirect(clientWorkspaceRedirectPath(id, { setup: "client-saved" }));
}

export async function deleteClientAction(id: string) {
  await requireAdminSession();
  await prisma.client.delete({ where: { id } });
  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

export async function upsertClientDriveAccountAction(clientId: string, formData: FormData) {
  await requireAdminSession();
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, name: true } });

  if (!client) {
    redirect("/admin/clients");
  }

  const formValues = Object.fromEntries(formData);
  const parsed = driveAccountSchema.parse({
    ...formValues,
    clientId
  });
  const driveAccountId = String(formData.get("driveAccountId") || "").trim();
  const data = {
    clientId,
    label: parsed.label || `${client.name} Drive`,
    googleEmail: textOrNull(parsed.googleEmail),
    accountType: parsed.accountType,
    rootFolderId: textOrNull(parsed.rootFolderId),
    sharedDriveId: textOrNull(parsed.sharedDriveId)
  };

  if (driveAccountId) {
    await prisma.driveAccount.update({
      where: { id: driveAccountId },
      data
    });
  } else {
    await prisma.driveAccount.create({ data });
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/drive-accounts");
  redirect(clientWorkspaceRedirectPath(clientId, { setup: "drive-saved" }));
}

export async function createClientRootFolderAction(clientId: string, formData: FormData) {
  await requireAdminSession();
  const driveAccountId = String(formData.get("driveAccountId") || "").trim();
  const folderName = String(formData.get("folderName") || "").trim();

  if (!driveAccountId || !folderName) {
    redirect(clientWorkspaceRedirectPath(clientId, { error: "folder-name" }));
  }

  let folderId = "";

  try {
    const folder = await createFolder(driveAccountId, folderName);
    folderId = String(folder.id || "");
  } catch {
    redirect(clientWorkspaceRedirectPath(clientId, { error: "folder-create" }));
  }

  if (!folderId) {
    redirect(clientWorkspaceRedirectPath(clientId, { error: "folder-create" }));
  }

  await prisma.driveAccount.update({
    where: { id: driveAccountId },
    data: { rootFolderId: folderId }
  });

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/drive-accounts");
  redirect(clientWorkspaceRedirectPath(clientId, { setup: "folder-created" }));
}

export async function createDriveAccountAction(formData: FormData) {
  await requireAdminSession();
  const parsed = driveAccountSchema.parse(Object.fromEntries(formData));

  await prisma.driveAccount.create({
    data: {
      clientId: textOrNull(parsed.clientId),
      label: parsed.label,
      googleEmail: textOrNull(parsed.googleEmail),
      accountType: parsed.accountType,
      rootFolderId: textOrNull(parsed.rootFolderId),
      sharedDriveId: textOrNull(parsed.sharedDriveId)
    }
  });

  revalidatePath("/admin/drive-accounts");
  redirect("/admin/drive-accounts");
}

export async function updateDriveAccountAction(id: string, formData: FormData) {
  await requireAdminSession();
  const parsed = driveAccountSchema.parse(Object.fromEntries(formData));

  await prisma.driveAccount.update({
    where: { id },
    data: {
      clientId: textOrNull(parsed.clientId),
      label: parsed.label,
      googleEmail: textOrNull(parsed.googleEmail),
      accountType: parsed.accountType,
      rootFolderId: textOrNull(parsed.rootFolderId),
      sharedDriveId: textOrNull(parsed.sharedDriveId)
    }
  });

  revalidatePath("/admin/drive-accounts");
  revalidatePath(`/admin/drive-accounts/${id}`);
  redirect(`/admin/drive-accounts/${id}`);
}

export async function deleteDriveAccountAction(id: string) {
  await requireAdminSession();
  await prisma.driveAccount.delete({ where: { id } });
  revalidatePath("/admin/drive-accounts");
  redirect("/admin/drive-accounts");
}

export async function createEventAction(formData: FormData) {
  await requireAdminSession();
  const parsed = eventSchema.parse(Object.fromEntries(formData));
  const slug = await eventSlug({ name: parsed.name, slug: parsed.slug });
  const pinHash = await hashSecret(parsed.pin);

  const event = await prisma.event.create({
    data: {
      clientId: parsed.clientId,
      driveAccountId: parsed.driveAccountId,
      name: parsed.name,
      slug,
      eventType: textOrNull(parsed.eventType),
      eventDate: dateOrNull(parsed.eventDate),
      city: textOrNull(parsed.city),
      pinHash,
      accessMode: parsed.accessMode,
      expiryDate: expiryFromOption(parsed.expiryOption),
      downloadAllowed: parsed.downloadAllowed === "on",
      isPublished: parsed.isPublished === "on",
      albums: {
        create: [
          { name: "Haldi", slug: "haldi", sortOrder: 1 },
          { name: "Mehendi", slug: "mehendi", sortOrder: 2 },
          { name: "Wedding", slug: "wedding", sortOrder: 3 },
          { name: "Reception", slug: "reception", sortOrder: 4 },
          { name: "Videos", slug: "videos", sortOrder: 5 }
        ]
      }
    }
  });

  revalidatePath("/admin/events");
  redirect(`/admin/events/${event.id}`);
}

export async function updateEventAction(id: string, formData: FormData) {
  await requireAdminSession();
  const parsed = eventSchema.parse(Object.fromEntries(formData));
  const slug = await eventSlug({ name: parsed.name, slug: parsed.slug, currentEventId: id });
  const pinHash = await hashSecret(parsed.pin);

  await prisma.event.update({
    where: { id },
    data: {
      clientId: parsed.clientId,
      driveAccountId: parsed.driveAccountId,
      name: parsed.name,
      slug,
      eventType: textOrNull(parsed.eventType),
      eventDate: dateOrNull(parsed.eventDate),
      city: textOrNull(parsed.city),
      pinHash,
      accessMode: parsed.accessMode,
      expiryDate: expiryFromOption(parsed.expiryOption),
      downloadAllowed: parsed.downloadAllowed === "on",
      isPublished: parsed.isPublished === "on"
    }
  });

  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function deleteEventAction(id: string) {
  await requireAdminSession();
  await prisma.event.delete({ where: { id } });
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function createEventDriveFoldersAction(id: string) {
  await requireAdminSession();
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      driveAccount: true
    }
  });

  if (!event) {
    redirect("/admin/events");
  }

  if (!event.driveFolderId) {
    const folder = await createFolder(event.driveAccountId, event.name, event.driveAccount.rootFolderId);

    if (folder.id) {
      await prisma.event.update({
        where: { id },
        data: { driveFolderId: folder.id }
      });
    }
  }

  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/admin/events");
  redirect(eventDriveRedirectPath(id, { drive: "folder-created" }));
}

export async function updateEventDriveFolderAction(id: string, formData: FormData) {
  await requireAdminSession();
  const driveFolderId = String(formData.get("driveFolderId") || "").trim();

  await prisma.event.update({
    where: { id },
    data: { driveFolderId: driveFolderId || null }
  });

  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/admin/events");
  redirect(eventDriveRedirectPath(id, { drive: "folder-saved" }));
}

export async function syncEventDriveGalleryAction(id: string) {
  await requireAdminSession();
  const event = await prisma.event.findUnique({
    where: { id },
    select: { slug: true, driveFolderId: true }
  });

  if (!event) {
    redirect("/admin/events");
  }

  if (!event.driveFolderId) {
    redirect(eventDriveRedirectPath(id, { driveError: "missing-folder" }));
  }

  try {
    await syncEventGalleryFromDrive(id);
    await processPreviewBatch(20, id).catch(() => null);
  } catch {
    redirect(eventDriveRedirectPath(id, { driveError: "sync-failed" }));
  }

  revalidatePath(`/admin/events/${id}`);
  revalidatePath(`/admin/events/${id}/albums`);
  revalidatePath("/admin/events");
  revalidatePath("/admin/albums");
  revalidatePath("/admin/media");
  revalidatePath("/admin/galleries");
  revalidatePath(`/gallery/${event.slug}`);
  redirect(eventDriveRedirectPath(id, { drive: "sync-complete" }));
}

export async function upsertClientGalleryAction(clientId: string, formData: FormData) {
  await requireAdminSession();
  const driveAccountId = String(formData.get("driveAccountId") || "").trim();
  const eventId = String(formData.get("eventId") || "").trim();
  const driveFolderId = String(formData.get("driveFolderId") || "").trim();

  if (!driveAccountId) {
    redirect(clientWorkspaceRedirectPath(clientId, { error: "drive-first" }));
  }

  const parsed = clientGallerySchema.parse({
    ...Object.fromEntries(formData),
    clientId,
    driveAccountId
  });
  const existingEvent = eventId
    ? await prisma.event.findFirst({ where: { id: eventId, clientId }, select: { id: true, pinHash: true } })
    : null;

  if (eventId && !existingEvent) {
    redirect(clientWorkspaceRedirectPath(clientId, { error: "gallery-missing" }));
  }

  if (!parsed.pin && !existingEvent) {
    redirect(clientWorkspaceRedirectPath(clientId, { error: "gallery-pin" }));
  }

  const slug = await eventSlug({
    name: parsed.name,
    slug: parsed.slug,
    currentEventId: eventId || undefined
  });
  const pinHash = parsed.pin ? await hashSecret(parsed.pin) : existingEvent!.pinHash;
  const data = {
    clientId,
    driveAccountId,
    name: parsed.name,
    slug,
    eventType: textOrNull(parsed.eventType),
    eventDate: dateOrNull(parsed.eventDate),
    city: textOrNull(parsed.city),
    pinHash,
    accessMode: parsed.accessMode,
    driveFolderId: driveFolderId || null,
    expiryDate: expiryFromOption(parsed.expiryOption),
    downloadAllowed: parsed.downloadAllowed === "on",
    isPublished: parsed.isPublished === "on"
  };

  const savedEvent = eventId
    ? await prisma.event.update({
      where: { id: eventId },
      data
    })
    : await prisma.event.create({ data });

  await ensureGalleryShareCode(savedEvent.id);

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/events");
  redirect(clientWorkspaceRedirectPath(clientId, { setup: "gallery-saved" }));
}

export async function createClientGalleryFolderAction(clientId: string, formData: FormData) {
  await requireAdminSession();
  const eventId = String(formData.get("eventId") || "").trim();
  const folderName = String(formData.get("folderName") || "").trim();
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { driveAccount: true }
  });

  if (!event) {
    redirect(clientWorkspaceRedirectPath(clientId, { error: "gallery-first" }));
  }

  const targetName = folderName || event.name;
  let folderId = "";

  try {
    const folder = await createFolder(event.driveAccountId, targetName, event.driveAccount.rootFolderId);
    folderId = String(folder.id || "");
  } catch {
    redirect(clientWorkspaceRedirectPath(clientId, { error: "gallery-folder-create" }));
  }

  if (!folderId) {
    redirect(clientWorkspaceRedirectPath(clientId, { error: "gallery-folder-create" }));
  }

  await prisma.event.update({
    where: { id: event.id },
    data: { driveFolderId: folderId }
  });

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/events");
  redirect(clientWorkspaceRedirectPath(clientId, { setup: "gallery-folder-created" }));
}

export async function syncClientGalleryFromDriveAction(clientId: string, formData: FormData) {
  await requireAdminSession();
  const eventId = String(formData.get("eventId") || "").trim();
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, slug: true, driveFolderId: true }
  });

  if (!event) {
    redirect(clientWorkspaceRedirectPath(clientId, { error: "gallery-first" }));
  }

  if (!event.driveFolderId) {
    redirect(clientWorkspaceRedirectPath(clientId, { error: "event-folder" }));
  }

  try {
    await syncEventGalleryFromDrive(event.id);
    await processPreviewBatch(20, event.id).catch(() => null);
  } catch {
    redirect(clientWorkspaceRedirectPath(clientId, { error: "gallery-sync" }));
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath(`/admin/events/${event.id}`);
  revalidatePath(`/admin/events/${event.id}/albums`);
  revalidatePath("/admin/events");
  revalidatePath("/admin/albums");
  revalidatePath("/admin/media");
  revalidatePath("/admin/galleries");
  revalidatePath(`/gallery/${event.slug}`);
  redirect(clientWorkspaceRedirectPath(clientId, { setup: "gallery-synced" }));
}

export async function updateClientGalleryCoverAction(clientId: string, formData: FormData) {
  await requireAdminSession();
  const eventId = String(formData.get("eventId") || "").trim();
  const mediaFileId = String(formData.get("mediaFileId") || "").trim();
  const positionX = Math.min(100, Math.max(0, Number(formData.get("positionX") || 50)));
  const positionY = Math.min(100, Math.max(0, Number(formData.get("positionY") || 50)));

  if (!eventId) {
    redirect(clientWorkspaceRedirectPath(clientId, { error: "gallery-first" }));
  }

  if (!mediaFileId) {
    await prisma.settings.deleteMany({
      where: { key: eventCoverKey(eventId) }
    });
  } else {
    const coverMedia = await prisma.mediaFile.findFirst({
      where: { id: mediaFileId, eventId },
      select: { id: true }
    });

    if (!coverMedia) {
      redirect(clientWorkspaceRedirectPath(clientId, { error: "cover-missing" }));
    }

    await prisma.settings.upsert({
      where: { key: eventCoverKey(eventId) },
      update: {
        value: { mediaFileId, positionX, positionY }
      },
      create: {
        key: eventCoverKey(eventId),
        value: { mediaFileId, positionX, positionY }
      }
    });
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath(`/gallery/${String(formData.get("eventSlug") || "").trim()}`);
  redirect(clientWorkspaceRedirectPath(clientId, { setup: "cover-saved" }));
}

export async function createAlbumAction(formData: FormData) {
  await requireAdminSession();
  const parsed = albumSchema.parse(Object.fromEntries(formData));
  const slug = await albumSlug({ eventId: parsed.eventId, name: parsed.name, slug: parsed.slug });

  await prisma.album.create({
    data: {
      eventId: parsed.eventId,
      name: parsed.name,
      slug,
      sortOrder: parsed.sortOrder,
      driveFolderId: textOrNull(parsed.driveFolderId)
    }
  });

  revalidatePath("/admin/albums");
  redirect("/admin/albums");
}

export async function updateAlbumAction(id: string, formData: FormData) {
  await requireAdminSession();
  const parsed = albumSchema.parse(Object.fromEntries(formData));
  const slug = await albumSlug({ eventId: parsed.eventId, name: parsed.name, slug: parsed.slug, currentAlbumId: id });

  await prisma.album.update({
    where: { id },
    data: {
      eventId: parsed.eventId,
      name: parsed.name,
      slug,
      sortOrder: parsed.sortOrder,
      driveFolderId: textOrNull(parsed.driveFolderId)
    }
  });

  revalidatePath("/admin/albums");
  redirect("/admin/albums");
}

export async function deleteAlbumAction(id: string) {
  await requireAdminSession();
  await prisma.album.delete({ where: { id } });
  revalidatePath("/admin/albums");
  redirect("/admin/albums");
}

export async function createMediaFileAction(formData: FormData) {
  await requireAdminSession();
  const parsed = mediaFileSchema.parse(Object.fromEntries(formData));

  await prisma.mediaFile.create({
    data: {
      eventId: parsed.eventId,
      albumId: textOrNull(parsed.albumId),
      driveAccountId: parsed.driveAccountId,
      driveFileId: parsed.driveFileId,
      fileName: parsed.fileName,
      mimeType: parsed.mimeType,
      mediaType: parsed.mediaType as MediaType,
      thumbnailUrl: textOrNull(parsed.thumbnailUrl),
      previewUrl: textOrNull(parsed.previewUrl),
      downloadAllowed: parsed.downloadAllowed === "on",
      isFeatured: parsed.isFeatured === "on"
    }
  });

  revalidatePath("/admin/media");
  redirect("/admin/media");
}

export async function deleteMediaFileAction(id: string) {
  await requireAdminSession();
  await prisma.mediaFile.delete({ where: { id } });
  revalidatePath("/admin/media");
  redirect("/admin/media");
}

export async function importDriveFolderAction(formData: FormData) {
  await requireAdminSession();
  const parsed = importDriveFolderSchema.parse(Object.fromEntries(formData));
  await importFilesFromFolder(parsed.driveAccountId, parsed.eventId, textOrNull(parsed.albumId), parsed.folderId);
  revalidatePath("/admin/media");
  redirect("/admin/media");
}

export async function updateInquiryStatusAction(id: string, formData: FormData) {
  await requireAdminSession();
  const status = formData.get("status");

  if (!status || !["NEW", "CONTACTED", "BOOKED", "ARCHIVED"].includes(String(status))) {
    return;
  }

  await prisma.inquiry.update({
    where: { id },
    data: { status: status as InquiryStatus }
  });

  revalidatePath("/admin/inquiries");
}

export async function updateWebsiteContentAction(formData: FormData) {
  await requireAdminSession();
  const parsed = websiteContentSchema.parse(Object.fromEntries(formData));

  await Promise.all([
    prisma.websiteContent.upsert({
      where: { key: "homeHero" },
      update: {
        value: {
          eyebrow: parsed.heroEyebrow,
          title: parsed.heroTitle,
          subtitle: parsed.heroSubtitle
        }
      },
      create: {
        key: "homeHero",
        value: {
          eyebrow: parsed.heroEyebrow,
          title: parsed.heroTitle,
          subtitle: parsed.heroSubtitle
        }
      }
    }),
    prisma.websiteContent.upsert({
      where: { key: "about" },
      update: {
        value: {
          heading: parsed.aboutHeading,
          paragraph1: parsed.aboutParagraph1,
          paragraph2: parsed.aboutParagraph2,
          paragraph3: parsed.aboutParagraph3
        }
      },
      create: {
        key: "about",
        value: {
          heading: parsed.aboutHeading,
          paragraph1: parsed.aboutParagraph1,
          paragraph2: parsed.aboutParagraph2,
          paragraph3: parsed.aboutParagraph3
        }
      }
    })
  ]);

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/client-login");
  revalidatePath("/admin/content");
  redirect("/admin/content");
}

export async function updateStudioSettingsAction(formData: FormData) {
  await requireAdminSession();
  const parsed = studioSettingsSchema.parse(Object.fromEntries(formData));

  await Promise.all([
    prisma.websiteContent.upsert({
      where: { key: "brand" },
      update: {
        value: {
          name: parsed.brandName,
          tagline: parsed.tagline,
          city: parsed.city
        }
      },
      create: {
        key: "brand",
        value: {
          name: parsed.brandName,
          tagline: parsed.tagline,
          city: parsed.city
        }
      }
    }),
    prisma.settings.upsert({
      where: { key: "contact" },
      update: {
        value: {
          whatsapp: parsed.whatsapp,
          email: parsed.email,
          instagram: parsed.instagram
        }
      },
      create: {
        key: "contact",
        value: {
          whatsapp: parsed.whatsapp,
          email: parsed.email,
          instagram: parsed.instagram
        }
      }
    }),
    prisma.settings.upsert({
      where: { key: "galleryDefaults" },
      update: {
        value: {
          defaultExpiryDays: Number(parsed.defaultExpiryDays),
          allowDownloadsByDefault: parsed.allowDownloadsByDefault === "on",
          pinLength: 4,
          publicDomain: parsed.publicDomain
        }
      },
      create: {
        key: "galleryDefaults",
        value: {
          defaultExpiryDays: Number(parsed.defaultExpiryDays),
          allowDownloadsByDefault: parsed.allowDownloadsByDefault === "on",
          pinLength: 4,
          publicDomain: parsed.publicDomain
        }
      }
    })
  ]);

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/client-login");
  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}
