import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class OmnifactApi implements ICredentialType {
	name = 'omnifactApi';
	displayName = 'Omnifact API';
	icon: Icon = { light: 'file:../icons/omnifact.svg', dark: 'file:../icons/omnifact.dark.svg' };
	documentationUrl = 'https://docs.omnifact.ai';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://connect.omnifact.ai',
			url: '/v1/documents/supported-file-types',
			method: 'GET',
		},
	};
}
