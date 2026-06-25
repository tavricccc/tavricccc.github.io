import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const GENERATED_POST_DIR = path.join('src', 'content', 'blog', 'craft');
const GENERATED_IMAGE_DIR = path.join('public', 'craft', 'images');
const PUBLISHED_STATUS = process.env.CRAFT_PUBLISHED_STATUS || 'Published';
const DRY_RUN = process.argv.includes('--dry-run');

const token = process.env.CRAFT_API_KEY;
const parentPageId = process.env.CRAFT_PARENT_PAGE_ID;
const craftApiUrl = process.env.CRAFT_API_URL;

if (!craftApiUrl) fail('Missing CRAFT_API_URL.');
if (!parentPageId) fail('Missing CRAFT_PARENT_PAGE_ID.');

const baseUrl = craftApiUrl.endsWith('/') ? craftApiUrl.slice(0, -1) : craftApiUrl;
let lastRequestAt = 0;
const usedSlugs = new Set();

async function main() {
	console.log('Fetching collections from Craft...');
	const collections = await getChildCollections(parentPageId);
	if (collections.length === 0) {
		fail('No child collections found under CRAFT_PARENT_PAGE_ID.');
	}

	console.log(`Found ${collections.length} child collection(s).`);

	const plannedPosts = [];
	for (const col of collections) {
		const schema = await getCollectionSchema(col.id);
		const propertyKeys = validateCollection(schema);
		const items = await queryPublishedItems(col.id, propertyKeys);
		console.log(`- ${col.name}: ${items.length} published item(s).`);
		plannedPosts.push(...items.map((item) => ({ collectionName: col.name, item, propertyKeys })));
	}

	if (DRY_RUN) {
		console.log(`Dry run complete. Would generate ${plannedPosts.length} post(s).`);
		return;
	}

	await cleanGeneratedContent();

	let generated = 0;
	for (const planned of plannedPosts) {
		await generatePost(planned);
		generated += 1;
	}

	console.log(`Generated ${generated} Craft post(s).`);
}

async function cleanGeneratedContent() {
	await rm(GENERATED_POST_DIR, { recursive: true, force: true });
	await rm(GENERATED_IMAGE_DIR, { recursive: true, force: true });
	await mkdir(GENERATED_POST_DIR, { recursive: true });
	await mkdir(GENERATED_IMAGE_DIR, { recursive: true });
}

async function generatePost({ collectionName, item, propertyKeys }) {
	const title = item.title || 'Untitled';
	const baseSlug = slugify(title) || 'untitled';
	const slug = uniqueSlug(baseSlug, slugify(collectionName));
	const postImageDir = path.join(GENERATED_IMAGE_DIR, slug);
	const imageContext = { slug, imageDir: postImageDir, count: 0 };

	const markdownBody = (await renderBlocks(item.content || [], imageContext)).trim();
	const description = getDescription(markdownBody);

	let tagsVal = [];
	if (propertyKeys.tags) {
		const rawTags = item.properties?.[propertyKeys.tags];
		if (Array.isArray(rawTags)) {
			tagsVal = rawTags;
		} else if (rawTags) {
			tagsVal = [rawTags];
		}
	}
	const tags = uniqueTags([collectionName, ...tagsVal]);

	let dateVal = '';
	if (propertyKeys.publishedDate) {
		dateVal = item.properties?.[propertyKeys.publishedDate];
	}
	const publishedDate = getDateProperty(dateVal) || toDateOnly(item.createdAt || Date.now());
	const updatedDate = toDateOnly(item.lastModifiedAt || item.createdAt || Date.now());

	const frontmatter = [
		'---',
		`title: ${yamlString(title)}`,
		`description: ${yamlString(description)}`,
		`pubDate: ${publishedDate}`,
		`updatedDate: ${updatedDate}`,
		`tags: ${yamlArray(tags)}`,
		'lang: "cn"',
		`group: ${yamlString(slug)}`,
		`slug: ${yamlString(slug)}`,
		'draft: false',
		'---',
		'',
	].join('\n');

	const content = `${frontmatter}${markdownBody || '_No content yet._'}\n`;
	await writeFile(path.join(GENERATED_POST_DIR, `${slug}.md`), content, 'utf8');
}

async function getChildCollections(pageId) {
	const response = await craftFetch(`/collections?documentIds=${pageId}`);
	return response.items || [];
}

async function getCollectionSchema(collectionId) {
	return craftFetch(`/collections/${collectionId}/schema?format=schema`);
}

function validateCollection(schema) {
	const properties = schema.properties || [];
	return {
		name: 'title',
		status: findPropertyKey(properties, ['Status', 'status']),
		publishedDate: findPropertyKey(properties, ['Published Date', '日期', 'publishedDate']),
		tags: findPropertyKey(properties, ['Tags', 'tags'])
	};
}

function findPropertyKey(propertiesSchema, preferredNames) {
	for (const name of preferredNames) {
		const found = propertiesSchema.find(
			(p) => p.name.toLowerCase() === name.toLowerCase() || p.key.toLowerCase() === name.toLowerCase()
		);
		if (found) return found.key;
	}
	const foundAny = propertiesSchema.find((p) =>
		preferredNames.some(
			(name) => p.name.toLowerCase().includes(name.toLowerCase()) || p.key.toLowerCase().includes(name.toLowerCase())
		)
	);
	return foundAny ? foundAny.key : undefined;
}

async function queryPublishedItems(collectionId, propertyKeys) {
	const response = await craftFetch(`/collections/${collectionId}/items?maxDepth=-1`);
	const items = response.items || [];

	return items.filter((item) => {
		if (!propertyKeys.status) return true;
		const statusVal = item.properties?.[propertyKeys.status];
		if (statusVal === undefined) return false;
		if (typeof statusVal === 'boolean') {
			return statusVal === true;
		}
		return String(statusVal).toLowerCase() === PUBLISHED_STATUS.toLowerCase();
	});
}

async function renderBlocks(blocks, imageContext, depth = 0) {
	const lines = [];
	for (const block of blocks) {
		const rendered = await renderBlock(block, imageContext, depth);
		if (rendered !== undefined && rendered !== null) lines.push(rendered);
	}
	return lines.join('\n\n');
}

async function renderBlock(block, imageContext, depth) {
	const type = block.type;
	switch (type) {
		case 'text':
			return block.markdown || '';
		case 'image':
			return renderImageBlock(block, imageContext);
		case 'page': {
			const title = block.markdown || '';
			const children = block.content ? await renderBlocks(block.content, imageContext, depth + 1) : '';
			if (depth === 0) {
				return children;
			}
			return [`### ${title}`, children].filter(Boolean).join('\n\n');
		}
		default:
			if (block.content && block.content.length > 0) {
				return renderBlocks(block.content, imageContext, depth);
			}
			return block.markdown || '';
	}
}

async function renderImageBlock(block, imageContext) {
	const url = block.url;
	if (!url) return '';

	const localUrl = await downloadAsset(url, imageContext);
	const alt = block.altText || 'Craft image';
	return `![${escapeMarkdown(alt)}](${localUrl})`;
}

async function downloadAsset(url, imageContext) {
	await mkdir(imageContext.imageDir, { recursive: true });
	imageContext.count += 1;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download asset ${url}: ${response.status} ${response.statusText}`);
	}

	const contentType = response.headers.get('content-type') || '';
	const ext = extensionFromUrl(url) || extensionFromContentType(contentType) || 'bin';
	const filename = `${String(imageContext.count).padStart(3, '0')}.${ext}`;
	const outputPath = path.join(imageContext.imageDir, filename);
	const bytes = Buffer.from(await response.arrayBuffer());

	const compressableExtensions = ['jpg', 'jpeg', 'png', 'webp'];
	if (compressableExtensions.includes(ext.toLowerCase())) {
		try {
			const webpFilename = `${String(imageContext.count).padStart(3, '0')}.webp`;
			const webpOutputPath = path.join(imageContext.imageDir, webpFilename);
			await sharp(bytes)
				.resize({ width: 1200, withoutEnlargement: true })
				.webp({ quality: 80 })
				.toFile(webpOutputPath);

			return `/craft/images/${imageContext.slug}/${webpFilename}`;
		} catch (err) {
			console.error(`⚠️ Image compression failed for ${url}, using original: ${err.message}`);
		}
	}

	await writeFile(outputPath, bytes);
	return `/craft/images/${imageContext.slug}/${filename}`;
}

async function craftFetch(pathname, init = {}) {
	await rateLimit();

	const headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		...(init.headers || {})
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const url = pathname.startsWith('http') ? pathname : `${baseUrl}${pathname}`;
	const response = await fetch(url, {
		...init,
		headers
	});

	if (response.status === 429) {
		const retryAfter = Number(response.headers.get('retry-after') || '1');
		await sleep(Math.max(retryAfter, 1) * 1000);
		return craftFetch(pathname, init);
	}

	if (response.status >= 500) {
		await sleep(1000);
		return craftFetch(pathname, init);
	}

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Craft API ${response.status} ${response.statusText}: ${body}`);
	}

	return response.json();
}

async function rateLimit() {
	const elapsed = Date.now() - lastRequestAt;
	if (elapsed < 200) await sleep(200 - elapsed);
	lastRequestAt = Date.now();
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDateProperty(value) {
	if (!value) return '';
	return String(value).slice(0, 10);
}

function getDescription(markdown) {
	const cleaned = markdown
		.split('\n')
		.map((line) => stripMarkdown(line).trim())
		.find((line) => line && !line.startsWith('|') && line !== '---');

	if (!cleaned) return 'A note synced from Craft.';
	return cleaned.length > 160 ? `${cleaned.slice(0, 157)}...` : cleaned;
}

function stripMarkdown(value) {
	return value
		.replace(/^#{1,6}\s+/, '')
		.replace(/^>\s?/, '')
		.replace(/^[-*+]\s+/, '')
		.replace(/^1\.\s+/, '')
		.replace(/!\[[^\]]*]\([^)]+\)/g, '')
		.replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
		.replace(/[`*_~]/g, '');
}

function uniqueTags(tags) {
	const seen = new Set();
	const result = [];
	for (const tag of tags) {
		const clean = String(tag || '').trim();
		if (!clean) continue;
		const key = clean.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(clean);
	}
	return result;
}

function uniqueSlug(baseSlug, databaseSlug) {
	let slug = baseSlug;
	if (usedSlugs.has(slug) && databaseSlug) slug = `${baseSlug}-${databaseSlug}`;

	let candidate = slug;
	let index = 2;
	while (usedSlugs.has(candidate)) {
		candidate = `${slug}-${index}`;
		index += 1;
	}

	usedSlugs.add(candidate);
	return candidate;
}

function slugify(value) {
	return String(value || '')
		.normalize('NFKD')
		.toLowerCase()
		.trim()
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function escapeMarkdown(value) {
	return String(value || '').replace(/([\\`*_{}\[\]()#+\-.!|>])/g, '\\$1');
}

function yamlString(value) {
	return JSON.stringify(String(value || ''));
}

function yamlArray(values) {
	return `[${values.map(yamlString).join(', ')}]`;
}

function toDateOnly(value) {
	return new Date(value).toISOString().slice(0, 10);
}

function extensionFromUrl(url) {
	try {
		const pathname = new URL(url).pathname;
		const ext = path.extname(pathname).replace('.', '').toLowerCase();
		return ext && ext.length <= 5 ? ext : '';
	} catch {
		return '';
	}
}

function extensionFromContentType(contentType) {
	const normalized = contentType.split(';')[0].trim().toLowerCase();
	const map = {
		'image/jpeg': 'jpg',
		'image/png': 'png',
		'image/gif': 'gif',
		'image/webp': 'webp',
		'image/svg+xml': 'svg',
		'application/pdf': 'pdf',
	};
	return map[normalized] || '';
}

function fail(message) {
	console.error(message);
	process.exit(1);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
