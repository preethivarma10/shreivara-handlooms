import type { Config } from '@netlify/functions';
import { authorizeOwner } from '../lib/owner-auth.mjs';

export default async function ownerHandler(): Promise<Response> {
  const authorizationError = await authorizeOwner();
  if (authorizationError) return authorizationError;

  return new Response(null, { status: 204 });
}

export const config: Config = {
  path: '/api/owner',
  method: 'GET'
};
