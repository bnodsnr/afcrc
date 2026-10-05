import {fail, redirect} from '@sveltejs/kit';
import type {Actions, PageServerLoad} from './$types';
import {PUBLIC_API_BASE_URL} from '$env/static/public';

export const load: PageServerLoad = async ({ fetch, url, cookies }) => {
  const page      = url.searchParams.get('page')       ?? '1';
  const pageSize  = url.searchParams.get('page_size')  ?? '5';
  const status    = url.searchParams.get('status')     ?? '';
  const startDate = url.searchParams.get('start_date') ?? '';
  const endDate   = url.searchParams.get('end_date')   ?? '';

  const token = cookies.get('adm_access_token');

  const params = new URLSearchParams({ page, page_size: pageSize });
  if (status)    params.append('status', status);
  if (startDate) params.append('start_date', startDate);
  if (endDate)   params.append('end_date', endDate);

  const res = await fetch(`${PUBLIC_API_BASE_URL}/api/orders/admin/?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

    const json = await res.json();
    
    console.log(json);

  return {
    orders:     json.data,
    pagination: json.pagination
  };
};