import { RevenueChart } from "../revenue-chart";

export default function RevenueChartExample() {
  const mockData = [
    { month: "Jan", revenue: 12500 },
    { month: "Fev", revenue: 15800 },
    { month: "Mar", revenue: 14200 },
    { month: "Abr", revenue: 18900 },
    { month: "Mai", revenue: 21300 },
    { month: "Jun", revenue: 19700 },
  ];

  return (
    <div className="p-6 max-w-4xl">
      <RevenueChart data={mockData} />
    </div>
  );
}
