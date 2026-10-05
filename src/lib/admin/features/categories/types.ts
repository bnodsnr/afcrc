export interface Category {
    id: number;
    name: string;
    slug: string;
    seo_slug: string;
    description: string;
    image: File | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}