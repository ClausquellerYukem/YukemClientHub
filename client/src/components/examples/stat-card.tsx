import { StatCard } from "../stat-card";
import { Users } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="p-6 max-w-sm">
      <StatCard
        title="Total de Clientes"
        value="248"
        icon={Users}
        trend={{ value: "12%", isPositive: true }}
        testId="stat-total-clients"
      />
    </div>
  );
}
