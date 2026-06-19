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
		name: 'tavrics',
		kind: 'project',
		github: 'ying0930',
		url: 'https://github.com/ying0930/tavrics',
		description: 'The source repository for Tavric\'s Blog.',
		tags: ['GitHub', 'Blog', 'Astro'],
		status: 'active',
	},
	{
		name: 'NNKIEH-SRP',
		kind: 'project',
		github: 'ying0930',
		url: 'https://github.com/ying0930/NNKIEH-SRP',
		description: 'Project repository for NNKIEH-SRP.',
		tags: ['GitHub', 'Repository'],
		status: 'active',
	},
	{
		name: 'Hynan',
		kind: 'project',
		github: 'ying0930',
		url: 'https://github.com/ying0930/Hynan',
		description: 'Project repository for Hynan.',
		tags: ['GitHub', 'Repository'],
		status: 'active',
	},
	{
		name: 'lexiro',
		kind: 'project',
		github: 'ying0930',
		url: 'https://github.com/ying0930/lexiro',
		description: 'Project repository for lexiro.',
		tags: ['GitHub', 'Repository'],
		status: 'active',
	},
	{
		name: 'Wordat',
		kind: 'project',
		github: 'ying0930',
		url: 'https://github.com/ying0930/Wordat',
		description: 'Project repository for Wordat.',
		tags: ['GitHub', 'Repository'],
		status: 'active',
	},
];
