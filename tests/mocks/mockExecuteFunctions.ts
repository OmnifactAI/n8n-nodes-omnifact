import type {
	IBinaryData,
	IDataObject,
	IExecuteFunctions,
	INode,
	INodeExecutionData,
} from 'n8n-workflow';

function get(obj: IDataObject, path: string): unknown {
	return path.split('.').reduce<unknown>((acc, key) => {
		if (acc && typeof acc === 'object') return (acc as IDataObject)[key];
		return undefined;
	}, obj);
}

export interface MockExecuteOptions {
	params?: IDataObject;
	items?: INodeExecutionData[];
	continueOnFail?: boolean;
	binaryData?: Record<string, IBinaryData>;
	binaryBuffers?: Record<string, Buffer>;
}

export function createMockExecuteFunctions(opts: MockExecuteOptions = {}): IExecuteFunctions {
	const params = opts.params ?? {};
	const items = opts.items ?? [
		{
			json: {},
			...(opts.binaryData ? { binary: opts.binaryData } : {}),
		},
	];
	const shouldContinueOnFail = opts.continueOnFail ?? false;

	const httpRequest = jest.fn();
	const httpRequestWithAuthentication = jest.fn();
	const assertBinaryData = jest.fn().mockImplementation((_index: number, prop: string) => {
		if (!opts.binaryData?.[prop]) {
			throw new Error(`No binary data found for property "${prop}"`);
		}
		return opts.binaryData[prop];
	});
	const getBinaryDataBuffer = jest.fn().mockImplementation((_idx: number, prop: string) => {
		return Promise.resolve(opts.binaryBuffers?.[prop] ?? Buffer.from('test'));
	});

	const mock = {
		getInputData: jest.fn().mockReturnValue(items),
		getNodeParameter: jest.fn().mockImplementation((name: string) => {
			const value = get(params, name);
			if (value === undefined) {
				throw new Error(`Parameter "${name}" not set`);
			}
			return value;
		}),
		getNode: jest.fn().mockReturnValue({
			name: 'Omnifact',
			type: 'n8n-nodes-omnifact.omnifact',
			typeVersion: 1,
			position: [0, 0],
			parameters: {},
		} as unknown as INode),
		continueOnFail: jest.fn().mockReturnValue(shouldContinueOnFail),
		helpers: {
			httpRequest,
			httpRequestWithAuthentication,
			returnJsonArray: jest.fn().mockImplementation((data: IDataObject | IDataObject[]) => {
				const arr = Array.isArray(data) ? data : [data];
				return arr.map((item) => ({ json: item }));
			}),
			constructExecutionMetaData: jest
				.fn()
				.mockImplementation((items: INodeExecutionData[]) => items),
			assertBinaryData,
			getBinaryDataBuffer,
		},
	} as unknown as IExecuteFunctions;

	return mock;
}
