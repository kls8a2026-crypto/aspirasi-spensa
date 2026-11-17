import { eq } from 'drizzle-orm';
import { PRIMARY_ADMIN_EMAIL } from '../config/appConfig.ts';
import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  emailVerified: boolean
) {
  const normalizedEmail = email.trim().toLowerCase();
  const isPrimaryAdmin =
    normalizedEmail === PRIMARY_ADMIN_EMAIL && emailVerified;

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);

    const nextIsAdmin = isPrimaryAdmin || Boolean(existing[0]?.isAdmin);

    const result = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
        isAdmin: nextIsAdmin,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: normalizedEmail,
          isAdmin: nextIsAdmin,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Gagal memverifikasi pengguna di database.', {
      cause: error,
    });
  }
}
