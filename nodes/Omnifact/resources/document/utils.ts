import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export function toExecutionData(
	this: IExecuteFunctions,
	data: IDataObject | IDataObject[],
	itemIndex: number,
): INodeExecutionData[] {
	return this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(data), {
		itemData: { item: itemIndex },
	});
}
