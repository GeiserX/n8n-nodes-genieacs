import { describe, it, expect } from 'vitest';
import { GenieAcsApi } from '../credentials/GenieAcsApi.credentials';

describe('GenieAcsApi Credentials', () => {
	const creds = new GenieAcsApi();

	it('has the correct name', () => {
		expect(creds.name).toBe('genieAcsApi');
	});

	it('has the correct displayName', () => {
		expect(creds.displayName).toBe('GenieACS API');
	});

	it('has documentationUrl', () => {
		expect(creds.documentationUrl).toContain('genieacs');
	});

	it('has url property with correct default', () => {
		const urlProp = creds.properties.find((p) => p.name === 'url');
		expect(urlProp).toBeDefined();
		expect(urlProp!.type).toBe('string');
		expect(urlProp!.default).toBe('http://localhost:7557');
		expect(urlProp!.required).toBe(true);
	});

	it('has username property', () => {
		const userProp = creds.properties.find((p) => p.name === 'username');
		expect(userProp).toBeDefined();
		expect(userProp!.type).toBe('string');
	});

	it('has password property with password type', () => {
		const passProp = creds.properties.find((p) => p.name === 'password');
		expect(passProp).toBeDefined();
		expect(passProp!.type).toBe('string');
		expect(passProp!.typeOptions).toEqual({ password: true });
	});

	it('uses Basic auth via generic authentication', () => {
		expect(creds.authenticate).toBeDefined();
		expect(creds.authenticate.type).toBe('generic');
		const headers = (creds.authenticate as any).properties.headers;
		expect(headers.Authorization).toContain('Basic');
		expect(headers.Authorization).toContain('base64');
	});

	it('has credential test request to /devices/', () => {
		expect(creds.test).toBeDefined();
		expect(creds.test.request.url).toBe('/devices/');
		expect(creds.test.request.baseURL).toBe('={{$credentials.url}}');
	});
});
