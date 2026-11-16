export interface CustomerReview {
  /** Public display name only, e.g. first name and last initial. */
  name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  text: string;
  category: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
}

// Add genuine customer submissions here after moderation and publication consent.
// Never include email addresses, order numbers, or other private customer data.
export const reviews: CustomerReview[] = [];
