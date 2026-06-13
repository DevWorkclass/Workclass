/**
 * Service de stockage des fichiers générés (PDF billets / certificats).
 *
 *  - PROD (Supabase configuré) : upload dans le bucket privé `documents` puis
 *    renvoi d'une URL signée à durée limitée. Le filesystem Render est éphémère,
 *    ce chemin est donc obligatoire en production.
 *  - DEV (sans Supabase) : écriture ASYNCHRONE sur disque local, URL `/uploads/*`
 *    servie par express.static (cf. app.ts).
 *
 * Les fichiers peuvent contenir des données personnelles (nom du participant) :
 * le bucket Supabase doit rester privé et l'accès passer par URL signée.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../../config/env';
import { getSupabaseServiceClient } from '../../../config/supabase';

const LOCAL_DIR = process.env.LOCAL_STORAGE_PATH ?? './uploads';

/** Durée de validité des URLs signées Supabase (30 jours). */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 30;

function supabaseConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

// Buckets déjà vérifiés (évite un appel réseau à chaque upload).
const ensuredBuckets = new Set<string>();

/**
 * Garantit l'existence d'un bucket Supabase (le crée si absent). Idempotent.
 * @param isPublic true pour un bucket public (images affichées sur le site).
 */
async function ensureBucket(bucket: string, isPublic: boolean): Promise<void> {
  if (ensuredBuckets.has(bucket)) return;
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase.storage.getBucket(bucket);
  if (!data) {
    const { error } = await supabase.storage.createBucket(bucket, { public: isPublic });
    // "already exists" possible en cas de course : on l'ignore.
    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`Creation bucket ${bucket} echouee: ${error.message}`);
    }
  }
  ensuredBuckets.add(bucket);
}

/**
 * Génère une URL signée fraîche pour un objet déjà uploadé (sans re-upload).
 * Utile quand l'URL stockée en DB a expiré (> 30 jours).
 * @param ttl durée en secondes (défaut 1h)
 */
export async function getSignedUrl(
  category: string,
  filename: string,
  ttl = 3600,
): Promise<string | null> {
  if (!supabaseConfigured()) return null;
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .createSignedUrl(`${category}/${filename}`, ttl);
  if (error || !data) return null;
  return data.signedUrl;
}

/**
 * Téléverse un PDF et renvoie une URL exploitable.
 * @param category sous-dossier logique (ex. `tickets`, `certificates`)
 * @param filename nom de fichier (ex. `WCG-2026-000001.pdf`)
 */
export async function uploadPdf(
  category: string,
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const objectPath = `${category}/${filename}`;

  if (supabaseConfigured()) {
    const supabase = getSupabaseServiceClient();
    const bucket = env.SUPABASE_STORAGE_BUCKET;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, buffer, { contentType: 'application/pdf', upsert: true });
    if (uploadError) {
      throw new Error(`Upload Storage echoue (${objectPath}): ${uploadError.message}`);
    }

    const { data, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);
    if (signError || !data) {
      throw new Error(`URL signee echouee (${objectPath}): ${signError?.message ?? 'inconnue'}`);
    }
    return data.signedUrl;
  }

  // Fallback dev : écriture async sur disque local.
  const dir = path.join(LOCAL_DIR, category);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
  return `/uploads/${category}/${filename}`;
}

/**
 * Téléverse une image dans le bucket PUBLIC et renvoie une URL publique stable
 * (les images des domaines sont affichées sur le site public, pas d'URL signée).
 * @param filename nom de fichier (ex. `domaine-1700000000.webp`)
 * @param contentType type MIME (ex. `image/webp`)
 */
export async function uploadImage(
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const objectPath = `images/${filename}`;

  if (supabaseConfigured()) {
    const supabase = getSupabaseServiceClient();
    const bucket = env.SUPABASE_PUBLIC_BUCKET;

    // Crée le bucket public au besoin (sinon "Bucket not found" → 500).
    await ensureBucket(bucket, true);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, buffer, { contentType, upsert: true });
    if (uploadError) {
      throw new Error(`Upload image echoue (${objectPath}): ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    return data.publicUrl;
  }

  // Fallback dev : disque local servi par express.static (/uploads/*).
  const dir = path.join(LOCAL_DIR, 'images');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
  return `/uploads/images/${filename}`;
}
