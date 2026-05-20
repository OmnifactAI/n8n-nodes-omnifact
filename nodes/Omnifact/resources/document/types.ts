import type { IHttpRequestOptions } from 'n8n-workflow';

export type MultipartRequestBody = IHttpRequestOptions['body'] & FormData;
