import { useEffect, useState } from "react";

import { AdminTable } from "../../components/AdminTable";
import { listAdminCustomers } from "../../services/adminService";
import type { AdminCustomer } from "../../types/admin";
import { PageTitle, Status } from "./AdminProductsPage";

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);

  useEffect(() => {
    listAdminCustomers().then(setCustomers);
  }, []);

  return (
    <div>
      <PageTitle title="Customers" />
      <AdminTable columns={["Name", "Email", "Roles", "Verified", "Created"]}>
        {customers.map((customer) => (
          <tr key={customer.id}>
            <td className="px-4 py-3 font-semibold">{customer.first_name} {customer.last_name}</td>
            <td className="px-4 py-3 text-slate-600">{customer.email}</td>
            <td className="px-4 py-3">{customer.roles.join(", ")}</td>
            <td className="px-4 py-3"><Status value={customer.is_email_verified ? "verified" : "pending"} /></td>
            <td className="px-4 py-3 text-slate-600">{new Date(customer.created_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

