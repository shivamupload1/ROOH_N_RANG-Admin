import type { Album } from "@prisma/client";
import { SelectField } from "@/components/admin/form-controls";
import { FormField } from "@/components/admin/form-field";

type AlbumFormFieldsProps = {
  events: Array<{ id: string; name: string }>;
  album?: Album;
  fixedEventId?: string;
};

export function AlbumFormFields({ events, album, fixedEventId }: AlbumFormFieldsProps) {
  return (
    <>
      {fixedEventId ? <input type="hidden" name="eventId" value={fixedEventId} /> : null}
      {!fixedEventId ? (
        <SelectField
          label="Event"
          name="eventId"
          required
          defaultValue={album?.eventId}
          options={[{ label: "Choose event", value: "" }, ...events.map((event) => ({ label: event.name, value: event.id }))]}
        />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Album name" name="name" defaultValue={album?.name || ""} placeholder="Haldi" required />
        <FormField label="Slug" name="slug" defaultValue={album?.slug || ""} placeholder="auto from album name" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Sort order" name="sortOrder" type="number" min={0} defaultValue={album?.sortOrder ?? 0} />
        <FormField label="Drive folder ID" name="driveFolderId" defaultValue={album?.driveFolderId || ""} />
      </div>
    </>
  );
}
