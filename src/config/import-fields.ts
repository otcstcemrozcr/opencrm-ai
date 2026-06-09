export type ImportEntity = "account" | "contact" | "lead";

export type ImportField = { key: string; label: string; required?: boolean };

export const IMPORT_FIELDS: Record<ImportEntity, ImportField[]> = {
  account: [
    { key: "name", label: "Name", required: true },
    { key: "type", label: "Type (prospect/customer/partner/other)" },
    { key: "industry", label: "Industry" },
    { key: "website", label: "Website" },
    { key: "phone", label: "Phone" },
    { key: "city", label: "City" },
    { key: "country", label: "Country" },
  ],
  contact: [
    { key: "name", label: "Name", required: true },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "title", label: "Title" },
  ],
  lead: [
    { key: "company", label: "Company", required: true },
    { key: "contactName", label: "Contact name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "source", label: "Source" },
    { key: "industry", label: "Industry" },
    { key: "status", label: "Status (new/working/qualified/unqualified)" },
    { key: "score", label: "Score (0-100)" },
  ],
};

export const IMPORT_LABELS: Record<ImportEntity, string> = {
  account: "Accounts",
  contact: "Contacts",
  lead: "Leads",
};
