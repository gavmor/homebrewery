/* Foxhole theme snippets: field paperwork furniture. */

export default [
	{
		groupName : 'Text Editor',
		icon      : 'fas fa-pencil-alt',
		view      : 'text',
		snippets  : [
			{
				name : 'Column Break',
				icon : 'fas fa-columns',
				gen  : '\n\\column\n'
			},
			{
				name : 'New Page',
				icon : 'fas fa-file-alt',
				gen  : '\n\\page\n'
			},
			{
				name : 'Auto-incrementing Page Number',
				icon : 'fas fa-sort-numeric-down',
				gen  : '{{pageNumber,auto}}\n'
			}
		]
	},
	{
		groupName : 'Foxhole',
		icon      : 'fas fa-stamp',
		view      : 'text',
		snippets  : [
			{
				name : 'Rubber Stamp',
				icon : 'fas fa-stamp',
				gen  : '{{stamp\nAPPROVED\n}}\n'
			},
			{
				name : 'Field Note',
				icon : 'fas fa-note-sticky',
				gen  : '{{fieldnote\nQuartermaster\u2019s note: record the figure from the hull\u2019s gauge. Do not estimate.\n}}\n'
			},
			{
				name : 'Routing Block',
				icon : 'fas fa-route',
				gen  : '{{routing\nFROM: SPEAKING WOODS COMMAND\nTO: 56TH ARMOURED CORPS, QUARTERMASTER\nRE: REQUISITION\n}}\n'
			},
			{
				name : 'Masthead',
				icon : 'fas fa-heading',
				gen  : '{{masthead\n# REQUISITION ORDER\n}}\n'
			}
		]
	}
];
