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
		name: 'tavricccc.github.io',
		kind: 'project',
		github: 'tavricccc',
		url: 'https://github.com/tavricccc/tavricccc.github.io',
		description: 'The source repository for Tavric\'s Blog.',
		tags: ['GitHub', 'Blog', 'Astro'],
		status: 'active',
	},
	{
		name: 'NNKIEH-SRP',
		kind: 'project',
		github: 'tavricccc',
		url: 'https://github.com/tavricccc/NNKIEH-SRP',
		description: 'Project repository for NNKIEH-SRP.',
		tags: ['GitHub', 'Repository'],
		status: 'active',
	},
	{
		name: 'Hynan',
		kind: 'project',
		github: 'tavricccc',
		url: 'https://github.com/tavricccc/Hynan',
		description: 'Project repository for Hynan.',
		tags: ['GitHub', 'Repository'],
		status: 'active',
	},
	{
		name: 'lexiro',
		kind: 'project',
		github: 'tavricccc',
		url: 'https://github.com/tavricccc/lexiro',
		description: 'Project repository for lexiro.',
		tags: ['GitHub', 'Repository'],
		status: 'active',
	},
	{
		name: 'Wordat',
		kind: 'project',
		github: 'tavricccc',
		url: 'https://github.com/tavricccc/Wordat',
		description: 'Project repository for Wordat.',
		tags: ['GitHub', 'Repository'],
		status: 'active',
	},
];
