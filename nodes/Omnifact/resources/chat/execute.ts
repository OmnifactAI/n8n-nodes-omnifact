import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	executeSend,
	formatDocumentPartsAsMarkdown,
	formatInlineSourcesAsMarkdown,
} from './send/execute';

export { formatDocumentPartsAsMarkdown, formatInlineSourcesAsMarkdown };

export async function executeChatOperation(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	if (operation !== 'send') {
		throw new NodeOperationError(this.getNode(), `Unsupported chat operation "${operation}"`, {
			itemIndex,
		});
	}

	return executeSend.call(this, itemIndex);
}
