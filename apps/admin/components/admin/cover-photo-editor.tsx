"use client";

import Image from "next/image";
import { Monitor, Move, RotateCcw, Save, Smartphone } from "lucide-react";
import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { updateClientGalleryCoverAction } from "@/app/admin/(dashboard)/actions";

type CoverMediaOption = {
  id: string;
  fileName: string;
  width: number | null;
  height: number | null;
};

type CoverPosition = { x: number; y: number };

function clampPosition(value: number) {
  return Math.min(100, Math.max(0, value));
}

function DraggableCover({
  media,
  position,
  onChange,
  variant
}: {
  media: CoverMediaOption;
  position: CoverPosition;
  onChange: (position: CoverPosition) => void;
  variant: "desktop" | "mobile";
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ pointerX: number; pointerY: number; position: CoverPosition } | null>(null);
  const isMobile = variant === "mobile";

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      position
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStart.current || !frameRef.current) return;
    const bounds = frameRef.current.getBoundingClientRect();
    const deltaX = ((event.clientX - dragStart.current.pointerX) / Math.max(bounds.width, 1)) * 100;
    const deltaY = ((event.clientY - dragStart.current.pointerY) / Math.max(bounds.height, 1)) * 100;

    onChange({
      x: clampPosition(dragStart.current.position.x - deltaX),
      y: clampPosition(dragStart.current.position.y - deltaY)
    });
  }

  function stopDragging(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStart.current = null;
  }

  return (
    <div className={isMobile ? "min-w-0" : "min-w-0 sm:col-span-2 lg:col-span-1"}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
          {isMobile ? <Smartphone size={15} /> : <Monitor size={15} />}
          {isMobile ? "Phone" : "Desktop"}
        </p>
        <button
          type="button"
          onClick={() => onChange({ x: 50, y: 50 })}
          className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 text-ink/55 transition hover:border-ink hover:text-ink"
          title={`Reset ${variant} cover position`}
        >
          <RotateCcw size={14} />
        </button>
      </div>
      <div
        ref={frameRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        className={`group relative touch-none select-none overflow-hidden border border-ink/10 bg-ink/5 cursor-grab active:cursor-grabbing ${
          isMobile ? "mx-auto aspect-[4/5] w-full max-w-[240px]" : "aspect-[16/7] w-full"
        }`}
        title={`Drag to adjust the ${variant} cover`}
      >
        <Image
          src={`/api/media/${media.id}`}
          alt={media.fileName}
          fill
          draggable={false}
          unoptimized
          sizes={isMobile ? "240px" : "(min-width: 1024px) 34vw, 70vw"}
          className="pointer-events-none object-cover transition-transform duration-500 group-hover:scale-[1.01]"
          style={{ objectPosition: `${position.x}% ${position.y}%` }}
        />
        <span className="pointer-events-none absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/40 bg-black/25 text-white opacity-75 backdrop-blur-md transition group-hover:opacity-100">
          <Move size={14} />
        </span>
      </div>
    </div>
  );
}

export function CoverPhotoEditor({
  clientId,
  eventId,
  eventSlug,
  mediaOptions,
  initialMediaId,
  initialDesktopPositionX,
  initialDesktopPositionY,
  initialMobilePositionX,
  initialMobilePositionY
}: {
  clientId: string;
  eventId: string;
  eventSlug: string;
  mediaOptions: CoverMediaOption[];
  initialMediaId: string;
  initialDesktopPositionX: number;
  initialDesktopPositionY: number;
  initialMobilePositionX: number;
  initialMobilePositionY: number;
}) {
  const [mediaFileId, setMediaFileId] = useState(initialMediaId);
  const [desktopPosition, setDesktopPosition] = useState<CoverPosition>({
    x: initialDesktopPositionX,
    y: initialDesktopPositionY
  });
  const [mobilePosition, setMobilePosition] = useState<CoverPosition>({
    x: initialMobilePositionX,
    y: initialMobilePositionY
  });
  const selectedMedia = useMemo(
    () => mediaOptions.find((media) => media.id === mediaFileId) || null,
    [mediaFileId, mediaOptions]
  );

  return (
    <form action={updateClientGalleryCoverAction.bind(null, clientId)} className="mt-4 grid gap-4">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="eventSlug" value={eventSlug} />
      <input type="hidden" name="desktopPositionX" value={desktopPosition.x} />
      <input type="hidden" name="desktopPositionY" value={desktopPosition.y} />
      <input type="hidden" name="mobilePositionX" value={mobilePosition.x} />
      <input type="hidden" name="mobilePositionY" value={mobilePosition.y} />

      {selectedMedia ? (
        <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.65fr)_minmax(180px,.65fr)]">
          <DraggableCover media={selectedMedia} position={desktopPosition} onChange={setDesktopPosition} variant="desktop" />
          <DraggableCover media={selectedMedia} position={mobilePosition} onChange={setMobilePosition} variant="mobile" />
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

      <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
        <Save size={17} />
        Save Cover Photo
      </button>
    </form>
  );
}
