import { writable } from 'svelte/store';


export type Category = {
	id: number;
	name: string;
    slug: string;
    seo_slug: string;
	featured_image: string;
};


export type CategoryResponse = {
	categories: Category[];
};


export const categories = writable<Category[]>([]);