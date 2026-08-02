import { useEffect, useState } from "react";

import { AdminTable } from "../../components/AdminTable";
import { listAdminNotifications } from "../../services/engagementService";
import type { Notification } from "../../types/engagement";
import { PageTitle, Status } from "./AdminProductsPage";

export function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    listAdminNotifications().then(setNotifications);
  }, []);

  return (
    <div>
      <PageTitle title="Notifications" />
      <AdminTable columns={["Title", "Type", "Message", "Order", "Read"]}>
        {notifications.map((notification) => (
          <tr key={notification.id}>
            <td className="px-4 py-3 font-semibold">{notification.title}</td>
            <td className="px-4 py-3">{notification.type}</td>
            <td className="px-4 py-3 text-slate-600">{notification.message}</td>
            <td className="px-4 py-3">{notification.related_order_number ?? "-"}</td>
            <td className="px-4 py-3"><Status value={notification.read ? "read" : "new"} /></td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

