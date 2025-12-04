export const CONTACT_CATEGORIES = ["speaking", "sponsorship", "collab", "other"] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];
