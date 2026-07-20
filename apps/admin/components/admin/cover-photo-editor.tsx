"use client";

import Image from "next/image";
import { Save } from "lucide-react";
import { useMemo, useState } from "react";
import { updateClientGalleryCoverAction } from "@/app/admin/(dashboard)/actions";

type CoverMediaOption = {
  id: string;
  fileName: string;
  width: number | null;
  height: number | null;
};

export function CoverPhotoEditor({
  clientId,
  eventId,
  eventSlug,
  mediaOptions,
  initialMediaId,
  initialPositionX,
  initialPositionY
}: {
  clientId: string;
  eventId: string;
  eventSlug: string;
  mediaOptions: CoverMediaOption[];
  initialMediaId: string;
  initialPositionX: number;
  initialPositionY: number;
}) {
  const [mediaFileId, setMediaFileId] = useState(initialMediaId);
  const [positionX, setPositionX] = useState(initialPositionX);
  const [positionY, setPositionY] = useState(initialPositionY);
  const selectedMedia = useMemo(
    () => mediaOptions.find((media) => media.id === mediaFileId) || null,
    [mediaFileId, mediaOptions]
  );

  return (
    <form action={updateClientGalleryCoverAction.bind(null, clientId)} className="mt-4 grid gap-4">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="eventSlug" value={eventSlug} />

      {selectedMedia ? (
        <div className="overflow-hidden rounded-lg border border-ink/10 bg-ink/5">
          <Image
            src={`/api/media/${selectedMedia.id}`}
            alt={selectedMedia.fileName}
            width={selectedMedia.width || 1600}
            height={selectedMedia.height || 900}
            unoptimized
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="block h-64 w-full object-cover transition-[object-position] duration-300"
            style={{ objectPosition: `${positionX}% ${positionY}%` }}
          />
        </div>
      ) : (
        <div className="grid h-40 place-items-center rounded-lg border border-dashed border-ink/15 bg-ivory text-sm text-ink/50">
          The gallery will automatically choose its first available photo.
        </div>
      )}

      <label className="grid gap-2 text-sm font-semibold text-ink">
        Cover photo
        <select
          name="mediaFileId"
          value={mediaFileId}
          onChange={(event) => setMediaFileId(event.target.value)}
          className="h-11 rounded-md border border-ink/15 bg-white px-3 text-sm font-medium text-ink outline-none transition focus:border-rust"
        >
          <option value="">Auto choose best photo</option>
          {mediaOptions.map((media) => (
            <option key={media.id} value={media.id}>{media.fileName}</option>
          ))}
        </select>
      </label>

      {selectedMedia ? (
        <div className="grid gap-4 rounded-md bg-ivory p-4 sm:grid-cols-2">
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink/65">
            Horizontal position {Math.round(positionX)}%
            <input name="positionX" type="range" min="0" max="100" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} className="accent-rust" />
          </label>
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink/65">
            Vertical position {Math.round(positionY)}%
            <input name="positionY" type="range" min="0" max="100" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} className="accent-rust" />
          </label>
        </div>
      ) : (
        <>
          <input type="hidden" name="positionX" value="50" />
          <input type="hidden" name="positionY" value="50" />
        </>
      )}

      <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
        <Save size={17} />
        Save Cover Photo
      </button>
    </form>
  );
}
