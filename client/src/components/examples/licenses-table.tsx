import { LicensesTable } from "../licenses-table";

export default function LicensesTableExample() {
  const mockLicenses = [
    {
      id: "1",
      clientName: "Tech Solutions Ltda",
      licenseKey: "YUKEM-2024-TECH-XYZ123",
      isActive: true,
      activatedAt: "2024-01-15",
      expiresAt: "2025-01-15",
    },
    {
      id: "2",
      clientName: "Comercial Santos",
      licenseKey: "YUKEM-2024-SANTOS-ABC456",
      isActive: true,
      activatedAt: "2024-03-20",
      expiresAt: "2025-03-20",
    },
    {
      id: "3",
      clientName: "Indústria Moderna",
      licenseKey: "YUKEM-2024-TRIAL-DEF789",
      isActive: false,
      activatedAt: "2024-11-01",
      expiresAt: "2024-12-01",
    },
  ];

  return (
    <div className="p-6">
      <LicensesTable
        licenses={mockLicenses}
        onToggle={(id, isActive) => console.log("Toggle license:", id, isActive)}
        onView={(id) => console.log("View license:", id)}
      />
    </div>
  );
}
