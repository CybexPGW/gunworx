export interface CustomerReview {
  /** Public display name only, e.g. first name and last initial. */
  name: string;
  /** Omit when the customer did not supply a star rating. */
  rating?: 1 | 2 | 3 | 4 | 5;
  title: string;
  text: string;
  category: string;
  /** Publication date, in ISO format (YYYY-MM-DD). */
  date: string;
}

// Add genuine customer submissions here after moderation and publication consent.
// Never include email addresses, order numbers, or other private customer data.
export const reviews: CustomerReview[] = [
  {
    name: 'Nick K',
    title: 'Match results',
    text: "The rifle I bought from you scored a 2300, 2400, 2450, and 3 2200's at yesterday's match. I told one of the shooters looking to upgrade you had ready to ship rifles, so hopefully he will be contacting you!",
    category: 'Customer review',
    date: '2026-11-16',
  },
];
