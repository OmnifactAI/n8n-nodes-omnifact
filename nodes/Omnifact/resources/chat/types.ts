export interface OmnifactInlineSource {
	documentId: string;
	documentName: string;
	page: number | null;
	partIndex: number;
	partName: string;
	sourceId: string;
	sourceType: string;
	messageId: string;
}

export interface OmnifactDocument {
	id: string;
	name: string;
	metadata: Record<string, unknown>;
}

export interface OmnifactDocumentPart {
	documentId: string;
	type: string;
	number: number;
	partIndex: number;
	partName: string;
}

export interface OmnifactChatResponse {
	id: string;
	content: string;
	// if inline soruces is disabled, this will be the references to the documents and document parts
	references: {
		documents: OmnifactDocument[];
		documentParts: OmnifactDocumentPart[];
	};
	// if inline soruces is enabled, this will be the references to the documents and document parts
	sources: OmnifactInlineSource[];
	tokenUsage: { inputTokens: number; outputTokens: number };
}
