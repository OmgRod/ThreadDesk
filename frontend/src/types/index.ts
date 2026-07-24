export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  bio?: string | null;
  website?: string | null;
  createdAt: string | Date;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  role?: string;
  createdAt: string | Date;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  published: boolean;
  visibility: "public" | "followers" | "members" | "unlisted";
  organization: Organization;
}

export interface Comment {
  id: number;
  content: string;
  user: User;
  createdAt: string;
}
