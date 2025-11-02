import { LicensesTable } from "@/components/licenses-table";
import { StatCard } from "@/components/stat-card";
import { Key, CheckCircle, XCircle } from "lucide-react";

export default function Licenses() {
  //todo: remove mock functionality
  const stats = [
    {
      title: "Total de Licenças",
      value: "248",
      icon: Key,
      testId: "stat-total-licenses",
    },
    {
      title: "Licenças Ativas",
      value: "235",
      icon: CheckCircle,
      trend: { value: "8%", isPositive: true },
      testId: "stat-active-licenses",
    },
    {
      title: "Licenças Inativas",
      value: "13",
      icon: XCircle,
      testId: "stat-inactive-licenses",
    },
  ];

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
    {
      id: "4",
      clientName: "Distribuidora ABC",
      licenseKey: "YUKEM-2024-DIST-GHI012",
      isActive: true,
      activatedAt: "2024-02-10",
      expiresAt: "2025-02-10",
    },
    {
      id: "5",
      clientName: "Logística Express",
      licenseKey: "YUKEM-2024-LOG-JKL345",
      isActive: false,
      activatedAt: "2024-04-05",
      expiresAt: "2024-10-05",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Licenças</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie licenças e ativações de clientes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <LicensesTable
        licenses={mockLicenses}
        onToggle={(id, isActive) => console.log("Toggle license:", id, isActive)}
        onView={(id) => console.log("View license:", id)}
      />
    </div>
  );
}
