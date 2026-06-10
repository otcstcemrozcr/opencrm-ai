import { Check, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROLES = ["Admin", "Manager", "Rep", "Viewer"] as const;

// Mirrors the rank-based RBAC in src/server/auth/rbac.ts (viewer<rep<manager<admin)
// and canWrite() (write requires >= rep). Read-only reference for admins.
const CAPABILITIES: { label: string; allowed: [boolean, boolean, boolean, boolean] }[] = [
  { label: "View CRM records", allowed: [true, true, true, true] },
  { label: "Create & edit records", allowed: [true, true, true, false] },
  { label: "Delete records & bulk actions", allowed: [true, true, true, false] },
  { label: "Import & merge data", allowed: [true, true, true, false] },
  { label: "User management", allowed: [true, false, false, false] },
  { label: "Audit log", allowed: [true, false, false, false] },
];

export function RoleMatrix() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Role permissions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 text-left font-medium">Capability</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-3 py-2 text-center font-medium">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((cap) => (
                <tr key={cap.label} className="border-b last:border-0">
                  <td className="py-2 pr-4">{cap.label}</td>
                  {cap.allowed.map((ok, i) => (
                    <td key={i} className="px-3 py-2 text-center">
                      {ok ? (
                        <Check className="mx-auto h-4 w-4 text-success" aria-label="Allowed" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" aria-label="Not allowed" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Permissions are role-based and fixed. Assign a role to grant the matching access.
        </p>
      </CardContent>
    </Card>
  );
}
