import type { DriveAccount, Event } from "@prisma/client";
import { CheckboxField, SelectField } from "@/components/admin/form-controls";
import { FormField } from "@/components/admin/form-field";

type EventFormFieldsProps = {
  clients: Array<{ id: string; name: string }>;
  driveAccounts: Array<Pick<DriveAccount, "id" | "label" | "status">>;
  event?: Event;
};

function dateInputValue(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function expiryDefault(date?: Date | null) {
  if (!date) {
    return "none";
  }

  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return days <= 45 ? "30" : "90";
}

export function EventFormFields({ clients, driveAccounts, event }: EventFormFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Client"
          name="clientId"
          required
          defaultValue={event?.clientId}
          options={[
            { label: "Choose client", value: "" },
            ...clients.map((client) => ({ label: client.name, value: client.id }))
          ]}
        />
        <SelectField
          label="Drive account"
          name="driveAccountId"
          required
          defaultValue={event?.driveAccountId}
          options={[
            { label: "Choose Drive account", value: "" },
            ...driveAccounts.map((account) => ({
              label: `${account.label} (${account.status})`,
              value: account.id
            }))
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Event name" name="name" defaultValue={event?.name || ""} required />
        <FormField label="Slug" name="slug" defaultValue={event?.slug || ""} placeholder="auto from event name" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Event type" name="eventType" defaultValue={event?.eventType || ""} placeholder="Wedding" />
        <FormField label="Event date" name="eventDate" type="date" defaultValue={dateInputValue(event?.eventDate)} />
        <FormField label="City" name="city" defaultValue={event?.city || ""} placeholder="Jaipur" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Gallery access"
          name="accessMode"
          defaultValue={event?.accessMode || "PIN"}
          options={[
            { label: "Private link + PIN", value: "PIN" },
            { label: "Public link", value: "PUBLIC" }
          ]}
        />
        <FormField
          label="4 digit gallery PIN"
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]{4}"
          minLength={4}
          maxLength={4}
          required
          placeholder="1234"
        />
        <SelectField
          label="Gallery expiry"
          name="expiryOption"
          defaultValue={expiryDefault(event?.expiryDate)}
          options={[
            { label: "30 days from save", value: "30" },
            { label: "90 days from save", value: "90" },
            { label: "No expiry", value: "none" }
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CheckboxField
          label="Published"
          name="isPublished"
          defaultChecked={event?.isPublished}
          helper="Only published events can be opened by clients."
        />
        <CheckboxField
          label="Allow downloads"
          name="downloadAllowed"
          defaultChecked={event?.downloadAllowed}
          helper="Media files also need download permission enabled."
        />
      </div>
    </>
  );
}
