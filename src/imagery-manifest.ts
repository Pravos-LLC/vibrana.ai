/**
 * Thin typed loader over the generated imagery asset manifest
 * (`public/assets/imagery/manifest.json`). The manifest is the source of
 * truth for every promoted homepage image: id, file path, category, copy
 * (title/description), aspect ratio, and generation provenance (prompt +
 * grading preset). This module just types it and exposes small lookup
 * helpers — it does not transform or duplicate the data.
 */

import { siteContent } from '@/src/site-content'
import manifestJson from '../public/assets/imagery/manifest.json'

export interface ImageryAssetSource {
  mode: 'text'
  prompt: string
  /**
   * Present only when `prompt` could not be traced back to a source
   * experiment README and fell back to the asset's caption/description.
   */
  promptSource?: 'caption-fallback'
}

export interface ImageryAsset {
  id: string
  file: string
  collection: string
  category: string
  title: string
  description: string
  /** CSS aspect-ratio value, e.g. "4 / 5", "3 / 2", "1 / 1". */
  aspect: string
  source: ImageryAssetSource
  preset: string
  tags: string[]
  status: string
  createdAt: string
}

interface ImageryManifest {
  version: number
  assets: ImageryAsset[]
}

const manifest = manifestJson as ImageryManifest

const display = siteContent<Record<string, Pick<ImageryAsset, 'file' | 'title' | 'description' | 'aspect'>>>('imagery.display', {})
export const IMAGERY_MANIFEST: ImageryAsset[] = manifest.assets.map((asset) => {
  const override = display[asset.id]
  return override ? { ...asset, file: override.file, title: override.title, description: override.description, aspect: override.aspect } : asset
})

/** Look up a single asset by id. */
export function getImagery(id: string): ImageryAsset | undefined {
  return IMAGERY_MANIFEST.find((asset) => asset.id === id)
}

export interface ImageryFilter {
  collection?: string
  category?: string
  tag?: string
}

/** List assets, optionally narrowed by collection, category, and/or tag. */
export function listImagery(filter?: ImageryFilter): ImageryAsset[] {
  if (!filter) return IMAGERY_MANIFEST
  return IMAGERY_MANIFEST.filter((asset) => {
    if (filter.collection && asset.collection !== filter.collection) return false
    if (filter.category && asset.category !== filter.category) return false
    if (filter.tag && !asset.tags.includes(filter.tag)) return false
    return true
  })
}
