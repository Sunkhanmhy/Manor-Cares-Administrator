import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { GlassCard } from '../../components/GlassCard';
import { FullPageSpinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { formatDate } from '../../lib/format';
import type { ServiceReview } from '../../types/database';

export function ReviewsPage() {
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('service_reviews')
      .select('*, customer_profiles(customer_number, profiles(first_name, last_name)), bookings(booking_number)')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setReviews((data as ServiceReview[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <FullPageSpinner label="Loading reviews…" />;

  return (
    <GlassCard style={{ padding: 0 }}>
      {reviews.length === 0 ? (
        <EmptyState icon="⭐" title="No reviews yet" />
      ) : (
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Booking</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.customer_profiles?.profiles?.first_name} {r.customer_profiles?.profiles?.last_name}
                  </td>
                  <td>{r.bookings?.booking_number}</td>
                  <td>{'⭐'.repeat(r.rating)}</td>
                  <td style={{ maxWidth: 320, whiteSpace: 'normal' }}>{r.review ?? '—'}</td>
                  <td>{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
