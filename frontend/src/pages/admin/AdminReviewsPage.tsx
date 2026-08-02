import { useEffect, useState } from "react";

import { AdminTable } from "../../components/AdminTable";
import { listAdminReviews } from "../../services/engagementService";
import type { Review } from "../../types/engagement";
import { PageTitle, Status } from "./AdminProductsPage";

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    listAdminReviews().then(setReviews);
  }, []);

  return (
    <div>
      <PageTitle title="Reviews" />
      <AdminTable columns={["Customer", "Rating", "Comment", "Verified", "Status"]}>
        {reviews.map((review) => (
          <tr key={review.id}>
            <td className="px-4 py-3 font-semibold">{review.customer_name}</td>
            <td className="px-4 py-3">{review.rating}/5</td>
            <td className="px-4 py-3 text-slate-600">{review.comment}</td>
            <td className="px-4 py-3"><Status value={review.verified_purchase ? "yes" : "no"} /></td>
            <td className="px-4 py-3"><Status value={review.status} /></td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

