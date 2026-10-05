import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { base } from '$lib/admin/paths';

export const load: PageServerLoad = async ({ fetch, cookies

}) => {
    const token = cookies.get('adm_access_token') || cookies.get('adm_access_token');
    if (!token) {
        throw redirect(302, `${base}/login`);
    }
    const  res = await fetch(`${PUBLIC_API_BASE_URL}/api/settings`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) {
        throw new Error('Failed to fetch settings');
    }
    const data = await res.json();
    console.log('Fetched settings:', data);
    return { data };
};

export const actions: Actions = {
    updateSettings: async ({ request, cookies, fetch }) => {
        const token = cookies.get('adm_access_token') || cookies.get('adm_access_token');
        if (!token) throw redirect(302, `${base}/login`);

        // Single multipart request handles both text + files
        const formData = await request.formData();
        formData.append('address_line1', formData.get('address_line1') || '');
        formData.append('address_line2', formData.get('address_line2') || '');
        formData.append('city', formData.get('city') || '');
        formData.append('state', formData.get('state') || '');
        formData.append('postal_code', formData.get('postal_code') || '');
        formData.append('country', formData.get('country') || '');
        formData.append('phone_number', formData.get('phone_number') || '');
        formData.append('email', formData.get('email') || '');
        formData.append('working_hours', formData.get('working_hours') || '');
        formData.append('map_embed_code', formData.get('map_embed_code') || '');
        formData.append('facebook_url', formData.get('facebook_url') || '');
        formData.append('twitter_url', formData.get('twitter_url') || '');
        formData.append('instagram_url', formData.get('instagram_url') || '');
        formData.append('linkedin_url', formData.get('linkedin_url') || '');
        formData.append('tiktok_url', formData.get('tiktok_url') || '');
        formData.append('youtube_url', formData.get('youtube_url') || '');
        const res = await fetch(`${PUBLIC_API_BASE_URL}/api/settings/create/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            // ⚠️ No Content-Type — SvelteKit sets multipart boundary automatically
            body: formData
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return fail(res.status, {
                error: err.message || 'Failed to save settings'
            });
        }

        return { success: true, message: 'Settings saved successfully!' };
    }
};