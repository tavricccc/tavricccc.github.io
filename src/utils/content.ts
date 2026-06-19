import type { CollectionEntry } from 'astro:content';

export function isPublishedPost(post: CollectionEntry<'blog'>): boolean {
	return post.data.draft !== true;
}
