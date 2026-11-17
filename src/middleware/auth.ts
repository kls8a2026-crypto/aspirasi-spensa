import type { NextFunction, Request, Response } from 'express';
import {
  isSupabaseAdminEmail,
  verifySupabaseAccessToken,
} from '../db/supabaseQueries.ts';
import { isSupabaseConfigured } from '../lib/supabase.ts';

export interface AuthRequest extends Request {
  dbUser?: {
    uid: string;
    email: string;
    isAdmin: boolean;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }

  if (!isSupabaseConfigured()) {
    res.status(503).json({
      error: 'Konfigurasi Supabase belum lengkap pada server.',
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const sbUser = await verifySupabaseAccessToken(token);
    if (!sbUser) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    const isAdmin = await isSupabaseAdminEmail(
      sbUser.email,
      sbUser.emailVerified
    );

    req.dbUser = {
      uid: sbUser.uid,
      email: sbUser.email,
      isAdmin,
    };
    next();
  } catch (error) {
    console.error('Error verifying Supabase token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.dbUser?.isAdmin) {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }
  next();
};
