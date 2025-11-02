import { ClientForm } from "../client-form";

export default function ClientFormExample() {
  return (
    <div className="p-6 max-w-4xl">
      <ClientForm
        onSubmit={(data) => console.log("Form submitted:", data)}
        onCancel={() => console.log("Form cancelled")}
      />
    </div>
  );
}
