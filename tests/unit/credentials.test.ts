import { OmnifactApi } from '../../credentials/OmnifactApi.credentials';

describe('OmnifactApi Credentials', () => {
	const creds = new OmnifactApi();

	it('should have the correct name', () => {
		expect(creds.name).toBe('omnifactApi');
	});

	it('should use X-API-Key header for authentication', () => {
		expect(creds.authenticate).toEqual({
			type: 'generic',
			properties: {
				headers: {
					'X-API-Key': '={{$credentials.apiKey}}',
				},
			},
		});
	});

	it('should have a test request targeting supported-file-types', () => {
		expect(creds.test).toEqual({
			request: {
				baseURL: 'https://connect.omnifact.ai',
				url: '/v1/documents/supported-file-types',
				method: 'GET',
			},
		});
	});

	it('should have an apiKey property with password type', () => {
		const apiKeyProp = creds.properties.find((p) => p.name === 'apiKey');
		expect(apiKeyProp).toBeDefined();
		expect(apiKeyProp!.type).toBe('string');
		expect(apiKeyProp!.typeOptions).toEqual({ password: true });
	});
});
