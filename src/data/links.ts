export type ProjectLink = {
	name: string;
	url: string;
	kind: 'project';
	github?: string;
	avatar?: string;
	description?: string;
	tags?: string[];
	status?: 'active' | 'inactive';
};

export const links: ProjectLink[] = [
	{
		name: 'CreatInf',
		kind: 'project',
		url: 'https://creatinf.com/',
		description: 'AI-assisted creative engineering tools and practical workflows.',
		tags: ['Project', 'AI', 'Tools'],
		status: 'active',
	},
	{
		name: 'fumigo',
		kind: 'project',
		url: 'https://fumigo.cn/',
		avatar: 'https://img.danarnoux.com/avatars/fumigo.webp',
		description: 'A Japanese learning website that applies AI to personalize the learning experience.',
		tags: ['Japanese', 'AI', 'Personalization'],
		status: 'active',
	},
];
