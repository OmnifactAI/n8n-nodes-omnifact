import {
	formatInlineSourcesAsMarkdown,
	formatDocumentPartsAsMarkdown,
} from '../../nodes/Omnifact/Omnifact.node';

describe('formatInlineSourcesAsMarkdown', () => {
	it('should return content unchanged when sources is empty', () => {
		expect(formatInlineSourcesAsMarkdown('Hello', [])).toBe('Hello');
	});

	it('should return content unchanged when sources is undefined', () => {
		expect(formatInlineSourcesAsMarkdown('Hello', undefined as never)).toBe('Hello');
	});

	it('should append footnotes with source names', () => {
		const sources = [
			{
				documentId: 'doc-1',
				documentName: 'Report.pdf',
				page: 5,
				partIndex: 0,
				partName: 'paragraph 3',
				sourceId: 'src-1',
				sourceType: 'document',
				messageId: 'message-1',
			},
			{
				documentId: 'doc-2',
				documentName: 'Guide.pdf',
				page: null,
				partIndex: 1,
				partName: 'section 1',
				sourceId: 'src-2',
				sourceType: 'document',
				messageId: 'message-1',
			},
		];
		const result = formatInlineSourcesAsMarkdown('Answer text', sources);
		expect(result).toContain('Answer text');
		expect(result).toContain('---');
		expect(result).toContain('**Sources:**');
		expect(result).toContain('[1] Report.pdf, p. 5');
		expect(result).toContain('[2] Guide.pdf');
		expect(result).not.toContain('p. null');
	});
});

describe('formatDocumentPartsAsMarkdown', () => {
	it('should return content unchanged when documentParts is empty', () => {
		expect(formatDocumentPartsAsMarkdown('Hello', [])).toBe('Hello');
	});

	it('should return content unchanged when documentParts is undefined', () => {
		expect(formatDocumentPartsAsMarkdown('Hello', undefined as never)).toBe('Hello');
	});

	it('should append footnotes with document part info', () => {
		const parts = [
			{ documentId: 'doc-1', type: 'paragraph', number: 3, partIndex: 0, partName: 'paragraph 3' },
			{ documentId: 'doc-2', type: 'section', number: 1, partIndex: 1, partName: 'section 1' },
		];
		const result = formatDocumentPartsAsMarkdown('Answer text', parts);
		expect(result).toContain('Answer text');
		expect(result).toContain('**Sources:**');
		expect(result).toContain('[1] doc-1 (paragraph 3)');
		expect(result).toContain('[2] doc-2 (section 1)');
	});
});
