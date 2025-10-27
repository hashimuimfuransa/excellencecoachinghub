// Use CommonJS require to avoid ESM/CJS constructor issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { UploadcareClient } = require('@uploadcare/rest-client');

let client: any = null;

export function getUploadcareClient(): any {
  const publicKey = process.env.UPLOADCARE_PUBLIC_KEY;
  const secretKey = process.env.UPLOADCARE_SECRET_KEY;
  if (!publicKey || !secretKey) return null;
  if (client) return client;
  try {
    client = new UploadcareClient({ publicKey, secretKey });
    // Some environments export factory instead of class; if constructor throws, fall back to require().default
    return client;
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const alt = require('@uploadcare/rest-client');
      const MaybeClient = alt.UploadcareClient || alt.default || alt;
      client = new MaybeClient({ publicKey, secretKey });
      return client;
    } catch (e) {
      return null;
    }
  }
}

export async function deleteUploadcareFileByCdnUrl(cdnUrl: string): Promise<boolean> {
  try {
    const client = getUploadcareClient();
    if (!client) return false;
    // CDN URL format: https://ucarecdn.com/<file-uuid>/filename
    const match = cdnUrl.match(/ucarecdn\.com\/([0-9a-fA-F-]+)/);
    const uuid = match?.[1];
    if (!uuid) return false;
    await client.files.delete({ uuid });
    return true;
  } catch (e) {
    return false;
  }
}

export function isUploadcareUrl(url?: string): boolean {
  return !!url && /ucarecdn\.com/.test(url);
}


