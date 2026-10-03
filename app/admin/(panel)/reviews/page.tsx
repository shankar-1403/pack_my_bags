import { ReviewsManager } from "@/components/admin/reviews-manager";
import { getReviews } from "@/lib/content";

export default async function ReviewsPage() {
  return (
    <div>
      <h1 className="font-serif text-5xl tracking-tight">Reviews</h1>
      <p className="mt-2 mb-8 text-sm text-mist">These quotes appear on the homepage.</p>
      <ReviewsManager initial={(await getReviews())} />
    </div>
  );
}
