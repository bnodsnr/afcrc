import { fail, redirect } from '@sveltejs/kit';
import { api } from '$lib/admin/api/client';
import type {PageServerLoad, Actions } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { form } from '$app/server';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({params, fetch, cookies }) => {
    const token = cookies.get('adm_access_token') || cookies.get('adm_access_token') || '';
    if (!token) {
        console.log('🔐 No auth token found, redirecting to login.');
        throw redirect(303, `${base}/login`);
    }
    try {
      
        const res = await fetch(`${PUBLIC_API_BASE_URL}/api/customers/admin/all/`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!res.ok) {
            console.error('❌ Invalid response format for customers:');
            throw new Error('Invalid response format');
        }
        const customers = await res.json();
        console.log('✅ Successfully loaded customers:', customers);
        return {
            customers: customers
            // pagination: customers.pagination
         };
    } catch (error) {
        console.error('❌ Error loading customers:', error);
        throw error;
    }
}
