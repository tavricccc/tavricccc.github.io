import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const NOTION_VERSION = '2022-06-28';
const GENERATED_POST_DIR = path.join('src', 'content', 'blog', 'notion');
const GENERATED_IMAGE_DIR = path.join('public', 'notion', 'images');
const PUBLISHED_STATUS = process.env.NOTION_PUBLISHED_STATUS || 'Published';
const DRY_RUN = process.argv.includes('--dry-run');

const token = process.env.NOTION_TOKEN;
const parentPageId = process.env.NOTION_PARENT_PAGE_ID;

if (!token) fail('Missing NOTION_TOKEN.');
if (!parentPageId) fail('Missing NOTION_PARENT_PAGE_ID.');

let lastRequestAt = 0;

const usedSlugs = new Set();

async function main() {
	const databases = await getChildDatabases(parentPageId);
	if (databases.length === 0) {
		fail('No child databases found under NOTION_PARENT_PAGE_ID.');
	}

	console.log(`Found ${databases.length} child database(s).`);

	const plannedPosts = [];
	for (const databaseBlock of databases) {
		const database = await notion(`/databases/${databaseBlock.id}`);
		const title = getDatabaseTitle(database) || databaseBlock.child_database?.title || 'untitled';
		const pages = await queryPublishedPages(database);
		console.log(`- ${title}: ${pages.length} published page(s).`);
		plannedPosts.push(...pages.map((page) => ({ database, databaseTitle: title, page })));
	}

	if (DRY_RUN) {
		console.log(`Dry run complete. Would generate ${plannedPosts.length} post(s).`);
		return;
	}

	await cleanGeneratedContent();

	let generated = 0;
	for (const item of plannedPosts) {
		await generatePost(item);
		generated += 1;
	}

	console.log(`Generated ${generated} Notion post(s).`);
}

async function cleanGeneratedContent() {
	await rm(GENERATED_POST_DIR, { recursive: true, force: true });
	await rm(GENERATED_IMAGE_DIR, { recursive: true, force: true });
	await mkdir(GENERATED_POST_DIR, { recursive: true });
	await mkdir(GENERATED_IMAGE_DIR, { recursive: true });
}

async function generatePost({ databaseTitle, page }) {
	const title = getTitleProperty(page.properties.Name) || 'Untitled';
	const baseSlug = slugify(title) || 'untitled';
	const slug = uniqueSlug(baseSlug, slugify(databaseTitle));
	const postImageDir = path.join(GENERATED_IMAGE_DIR, slug);
	const imageContext = { slug, imageDir: postImageDir, count: 0 };

	const blocks = await getBlockChildren(page.id);
	const markdownBody = (await renderBlocks(blocks, imageContext)).trim();
	const description = getDescription(markdownBody);
	const tags = uniqueTags([databaseTitle, ...getTagsProperty(page.properties.Tags)]);
	const publishedDate = getDateProperty(page.properties['Published Date']) || toDateOnly(page.created_time);
	const updatedDate = toDateOnly(page.last_edited_time);

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

async function getChildDatabases(pageId) {
	const blocks = await getBlockChildren(pageId);
	return blocks.filter((block) => block.type === 'child_database');
}

async function queryPublishedPages(database) {
	validateDatabase(database);

	const statusProp = database.properties.Status;

	let filter;
	if (statusProp.type === 'status') {
		filter = { property: 'Status', status: { equals: PUBLISHED_STATUS } };
	} else if (statusProp.type === 'select') {
		filter = { property: 'Status', select: { equals: PUBLISHED_STATUS } };
	} else if (statusProp.type === 'checkbox') {
		filter = { property: 'Status', checkbox: { equals: true } };
	} else {
		fail(`Database "${getDatabaseTitle(database)}" has unsupported Status type: ${statusProp.type}.`);
	}

	const pages = [];
	let cursor;
	do {
		const response = await notion(`/databases/${database.id}/query`, {
			method: 'POST',
			body: JSON.stringify({
				filter,
				sorts: [{ property: 'Published Date', direction: 'descending' }],
				page_size: 100,
				...(cursor ? { start_cursor: cursor } : {}),
			}),
		});
		pages.push(...response.results);
		cursor = response.has_more ? response.next_cursor : undefined;
	} while (cursor);
	return pages;
}

function validateDatabase(database) {
	const title = getDatabaseTitle(database);
	for (const required of ['Name', 'Status', 'Published Date', 'Tags']) {
		if (!database.properties[required]) {
			fail(`Database "${title}" is missing the ${required} property.`);
		}
	}

	const nameProp = database.properties.Name;
	if (nameProp.type !== 'title') {
		fail(`Database "${title}" property Name must be a title property.`);
	}

	const dateProp = database.properties['Published Date'];
	if (dateProp.type !== 'date') {
		fail(`Database "${title}" property Published Date must be a date property.`);
	}

	const tagsProp = database.properties.Tags;
	if (!['multi_select', 'select'].includes(tagsProp.type)) {
		fail(`Database "${title}" property Tags must be multi-select or select.`);
	}
}

async function getBlockChildren(blockId) {
	const results = [];
	let cursor;
	do {
		const query = new URLSearchParams({ page_size: '100' });
		if (cursor) query.set('start_cursor', cursor);
		const response = await notion(`/blocks/${blockId}/children?${query}`);
		results.push(...response.results);
		cursor = response.has_more ? response.next_cursor : undefined;
	} while (cursor);
	return results;
}

async function renderBlocks(blocks, imageContext, depth = 0) {
	const lines = [];
	for (const block of blocks) {
		const rendered = await renderBlock(block, imageContext, depth);
		if (rendered) lines.push(rendered);
	}
	return lines.join('\n\n');
}

async function renderBlock(block, imageContext, depth) {
	const type = block.type;
	const data = block[type];

	switch (type) {
		case 'paragraph':
			return renderRichText(data.rich_text);
		case 'heading_1':
			return renderHeading(1, data.rich_text);
		case 'heading_2':
			return renderHeading(2, data.rich_text);
		case 'heading_3':
			return renderHeading(3, data.rich_text);
		case 'bulleted_list_item':
			return renderListItem('-', data.rich_text, block, imageContext, depth);
		case 'numbered_list_item':
			return renderListItem('1.', data.rich_text, block, imageContext, depth);
		case 'to_do': {
			const text = renderRichText(data.rich_text);
			const childText = block.has_children ? await renderBlocks(await getBlockChildren(block.id), imageContext, depth + 1) : '';
			return [`${indent(depth)}- [${data.checked ? 'x' : ' '}] ${text}`, indentBlock(childText, depth + 1)].filter(Boolean).join('\n');
		}
		case 'quote':
			return blockquote(renderRichText(data.rich_text));
		case 'callout':
			return blockquote(renderRichText(data.rich_text));
		case 'divider':
			return '---';
		case 'code':
			return ['```' + (data.language || ''), richTextPlain(data.rich_text), '```'].join('\n');
		case 'image':
			return renderFileLike(data, imageContext, data.caption);
		case 'file':
		case 'pdf':
			return renderFileLike(data, imageContext, data.caption);
		case 'bookmark':
		case 'embed':
		case 'link_preview':
			return data.url ? `[${escapeMarkdown(data.url)}](${data.url})` : '';
		case 'table':
			return renderTable(block, imageContext);
		case 'toggle': {
			const title = renderRichText(data.rich_text);
			const children = block.has_children ? await renderBlocks(await getBlockChildren(block.id), imageContext, depth) : '';
			return [`### ${title}`, children].filter(Boolean).join('\n\n');
		}
		case 'child_database':
			console.log(`Skipping nested database block ${block.id}.`);
			return '';
		default:
			if (block.has_children) {
				return renderBlocks(await getBlockChildren(block.id), imageContext, depth);
			}
			return '';
	}
}

async function renderListItem(marker, richText, block, imageContext, depth) {
	const text = renderRichText(richText);
	const children = block.has_children ? await renderBlocks(await getBlockChildren(block.id), imageContext, depth + 1) : '';
	return [`${indent(depth)}${marker} ${text}`, indentBlock(children, depth + 1)].filter(Boolean).join('\n');
}

async function renderTable(block, imageContext) {
	const rows = await getBlockChildren(block.id);
	const cells = rows
		.filter((row) => row.type === 'table_row')
		.map((row) => row.table_row.cells.map((cell) => renderRichText(cell).replace(/\n/g, '<br>')));

	if (cells.length === 0) return '';

	const width = Math.max(...cells.map((row) => row.length));
	const normalized = cells.map((row) => [...row, ...Array(Math.max(0, width - row.length)).fill('')]);
	const header = normalized[0];
	const body = normalized.slice(1);

	return [
		`| ${header.join(' | ')} |`,
		`| ${Array.from({ length: width }, () => '---').join(' | ')} |`,
		...body.map((row) => `| ${row.join(' | ')} |`),
	].join('\n');
}

async function renderFileLike(fileObject, imageContext, caption = []) {
	const url = getFileUrl(fileObject);
	if (!url) return '';

	const localUrl = await downloadAsset(url, imageContext);
	const alt = richTextPlain(caption) || 'Notion image';
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

	await writeFile(outputPath, bytes);
	return `/notion/images/${imageContext.slug}/${filename}`;
}

function getFileUrl(fileObject) {
	if (fileObject.type === 'external') return fileObject.external?.url;
	if (fileObject.type === 'file') return fileObject.file?.url;
	return undefined;
}

function renderHeading(level, richText) {
	const text = renderRichText(richText);
	return text ? `${'#'.repeat(level)} ${text}` : '';
}

function renderRichText(items = []) {
	return items.map(renderRichTextItem).join('');
}

function renderRichTextItem(item) {
	let text = escapeMarkdown(item.plain_text || '');
	const annotations = item.annotations || {};

	if (annotations.code) text = '`' + text.replace(/`/g, '\\`') + '`';
	if (annotations.bold) text = `**${text}**`;
	if (annotations.italic) text = `_${text}_`;
	if (annotations.strikethrough) text = `~~${text}~~`;
	if (item.href) text = `[${text}](${item.href})`;
	return text;
}

function richTextPlain(items = []) {
	return items.map((item) => item.plain_text || '').join('');
}

function blockquote(text) {
	return text
		.split('\n')
		.map((line) => `> ${line}`)
		.join('\n');
}

function indent(level) {
	return '  '.repeat(level);
}

function indentBlock(text, level) {
	if (!text) return '';
	return text
		.split('\n')
		.map((line) => (line ? `${indent(level)}${line}` : line))
		.join('\n');
}

async function notion(pathname, init = {}) {
	await rateLimit();

	const response = await fetch(`https://api.notion.com/v1${pathname}`, {
		...init,
		headers: {
			Authorization: `Bearer ${token}`,
			'Notion-Version': NOTION_VERSION,
			'Content-Type': 'application/json',
			...(init.headers || {}),
		},
	});

	if (response.status === 429) {
		const retryAfter = Number(response.headers.get('retry-after') || '1');
		await sleep(Math.max(retryAfter, 1) * 1000);
		return notion(pathname, init);
	}

	if (response.status >= 500) {
		await sleep(1000);
		return notion(pathname, init);
	}

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Notion API ${response.status} ${response.statusText}: ${body}`);
	}

	return response.json();
}

async function rateLimit() {
	const elapsed = Date.now() - lastRequestAt;
	if (elapsed < 350) await sleep(350 - elapsed);
	lastRequestAt = Date.now();
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDatabaseTitle(database) {
	return richTextPlain(database.title || []).trim();
}

function getTitleProperty(property) {
	if (!property || property.type !== 'title') return '';
	return richTextPlain(property.title).trim();
}

function getTagsProperty(property) {
	if (!property) return [];
	if (property.type === 'multi_select') return property.multi_select.map((tag) => tag.name);
	if (property.type === 'select' && property.select) return [property.select.name];
	return [];
}

function getDateProperty(property) {
	if (!property || property.type !== 'date' || !property.date?.start) return '';
	return property.date.start.slice(0, 10);
}

function getDescription(markdown) {
	const cleaned = markdown
		.split('\n')
		.map((line) => stripMarkdown(line).trim())
		.find((line) => line && !line.startsWith('|') && line !== '---');

	if (!cleaned) return 'A note synced from Notion.';
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
