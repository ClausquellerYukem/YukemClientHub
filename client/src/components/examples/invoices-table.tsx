import { InvoicesTable } from "../invoices-table";

export default function InvoicesTableExample() {
  const mockInvoices = [
    {
      id: "001",
      clientName: "Tech Solutions Ltda",
      amount: 2500.00,
      dueDate: "2024-12-15",
      paidAt: "2024-12-10",
      status: "paid" as const,
    },
    {
      id: "002",
      clientName: "Comercial Santos",
      amount: 1200.00,
      dueDate: "2024-12-20",
      status: "pending" as const,
    },
    {
      id: "003",
      clientName: "Indústria Moderna",
      amount: 500.00,
      dueDate: "2024-11-30",
      status: "overdue" as const,
    },
  ];

  return (
    <div className="p-6">
      <InvoicesTable
        invoices={mockInvoices}
        onView={(id) => console.log("View invoice:", id)}
      />
    </div>
  );
}
