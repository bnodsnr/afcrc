# API Client

Centralized API client for making HTTP requests to the backend.

## Configuration

Set the backend API URL in your `.env` file:

```env
PUBLIC_BASE_URL=http://localhost:5000
```

## Usage

### In Server-Side Load Functions

```typescript
// +page.server.ts
import type { PageServerLoad } from './$types';
import { createApi } from '$lib/api';

export const load: PageServerLoad = async ({ fetch }) => {
  const api = createApi(fetch);
  
  const trending = await api.products.getTrending();
  const flashSales = await api.sales.getFlashSales();
  
  return {
    trending,
    flashSales
  };
};
```

### Available API Methods

#### Products API
- `api.products.getTrending()` - Get trending products
- `api.products.getBestSellers()` - Get best seller products
- `api.products.getPopular()` - Get popular products

#### Sales API
- `api.sales.getFlashSales()` - Get flash sales
- `api.sales.getDealsOfTheDay()` - Get deals of the day

#### Banners API
- `api.banners.getPromoBanners()` - Get promotional banners
- `api.banners.getHeroBanners()` - Get hero banners

#### Collections API
- `api.collections.getCollections()` - Get all collections
- `api.collections.getFeaturedCollections()` - Get featured collections

## Structure

- `client.ts` - Base API client with HTTP methods
- `types.ts` - TypeScript interfaces for API responses
- `products.ts` - Product-related API calls
- `sales.ts` - Sales and promotions API calls
- `banners.ts` - Banner and promotional content API calls
- `collections.ts` - Collections API calls
- `index.ts` - Main export file

## Adding New Endpoints

1. Add response types to `types.ts`
2. Create a new API class or add to existing one
3. Export from `index.ts`

Example:

```typescript
// types.ts
export interface CategoryData {
  id: string;
  name: string;
  image: string;
}

// categories.ts
export class CategoriesApi {
  constructor(private client: ApiClient) {}
  
  async getCategories(): Promise<CategoryData[] | null> {
    return this.client.get<CategoryData[]>('/api/categories');
  }
}

// index.ts
import { CategoriesApi } from './categories';

export function createApi(fetchFn: typeof fetch, baseUrl?: string) {
  const client = new ApiClient(fetchFn, baseUrl);
  
  return {
    // ... existing APIs
    categories: new CategoriesApi(client)
  };
}
```
