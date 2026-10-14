import { getUser } from '@netlify/identity';

declare const Netlify: {
  env: {
    get(name: string): string | undefined;
  };
};

export async function authorizeOwner(): Promise<Response | null> {
  const ownerEmail = Netlify.env.get('OWNER_EMAIL')?.trim().toLowerCase();
  if (!ownerEmail) {
    return Response.json({ error: 'Owner access is not configured.' }, { status: 503 });
  }

  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Sign in with the owner account to continue.' }, { status: 401 });
  }

  if (user.email?.trim().toLowerCase() !== ownerEmail) {
    return Response.json({ error: 'This account is not authorized to manage products.' }, { status: 403 });
  }

  return null;
}
