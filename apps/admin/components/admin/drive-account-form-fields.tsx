import type { DriveAccount } from "@prisma/client";
import { SelectField } from "@/components/admin/form-controls";
import { FormField } from "@/components/admin/form-field";

const accountTypeOptions = [
  { label: "Client Personal", value: "CLIENT_PERSONAL" },
  { label: "Studio Workspace", value: "STUDIO_WORKSPACE" },
  { label: "Shared Drive", value: "SHARED_DRIVE" }
];

type DriveAccountFormFieldsProps = {
  clients: Array<{ id: string; name: string }>;
  driveAccount?: DriveAccount;
};

export function DriveAccountFormFields({ clients, driveAccount }: DriveAccountFormFieldsProps) {
  const clientOptions = [
    { label: "No specific client", value: "" },
    ...clients.map((client) => ({ label: client.name, value: client.id }))
  ];

  return (
    <>
      <FormField label="Label" name="label" defaultValue={driveAccount?.label || ""} placeholder="Rahul & Priya Drive" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Google email"
          name="googleEmail"
          type="email"
          defaultValue={driveAccount?.googleEmail || ""}
          placeholder="client@gmail.com"
        />
        <SelectField
          label="Account type"
          name="accountType"
          options={accountTypeOptions}
          defaultValue={driveAccount?.accountType || "CLIENT_PERSONAL"}
        />
      </div>
      <SelectField label="Client" name="clientId" options={clientOptions} defaultValue={driveAccount?.clientId || ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Root folder ID"
          name="rootFolderId"
          defaultValue={driveAccount?.rootFolderId || ""}
          placeholder="Optional Drive folder ID"
        />
        <FormField
          label="Shared drive ID"
          name="sharedDriveId"
          defaultValue={driveAccount?.sharedDriveId || ""}
          placeholder="Only if this account uses a shared drive"
        />
      </div>
    </>
  );
}
