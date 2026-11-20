export interface CustomerReview {
  /** Public display name only, e.g. first name and last initial. Omit when the customer did not give one. */
  name?: string;
  /** Omit when the customer did not supply a star rating. */
  rating?: 1 | 2 | 3 | 4 | 5;
  /** Omit when the customer did not give a title. */
  title?: string;
  text: string;
  /** Omit when the customer did not say what the review is about. */
  category?: string;
  /** Publication date, in ISO format (YYYY-MM-DD). Omit when the customer did not give one. */
  date?: string;
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
  {
    name: 'Thomas S',
    text: `I love the build, it looks great, also had a few positive comments at the range yesterday.
The Arken scope needed a few minor clicks but after that I was getting some good groups going.
I shot a couple boxes of Lapua Center-X and am still adjusting the tuner, but overall shot very well out of the box at your tuner setting. (Which by the way is marked with the number 88 on a piece of tape??)
Knowing that every barrel is different and "likes" different ammo, what have you found that works well for you in the Muller barrels?`,
  },
];
