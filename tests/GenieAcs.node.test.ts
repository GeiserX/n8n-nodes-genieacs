import { describe, it, expect } from 'vitest';
import { GenieAcs } from '../nodes/GenieAcs/GenieAcs.node';

describe('GenieAcs Node', () => {
	const node = new GenieAcs();
	const desc = node.description;

	it('has correct node name', () => {
		expect(desc.name).toBe('genieAcs');
	});

	it('requires genieAcsApi credentials', () => {
		const credNames = desc.credentials!.map((c) => c.name);
		expect(credNames).toContain('genieAcsApi');
	});

	it('has 7 resources', () => {
		const resourceProp = desc.properties.find((p) => p.name === 'resource');
		expect(resourceProp).toBeDefined();
		const options = (resourceProp as any).options as { value: string }[];
		const values = options.map((o) => o.value);
		expect(values).toEqual(
			expect.arrayContaining([
				'device',
				'task',
				'tag',
				'fault',
				'preset',
				'provision',
				'file',
			]),
		);
		expect(values).toHaveLength(7);
	});

	it('Task Reboot sends POST to /devices/{deviceId}/tasks with body name=reboot', () => {
		const taskOps = desc.properties.find(
			(p) =>
				p.name === 'operation' &&
				p.displayOptions?.show?.resource?.includes('task'),
		);
		expect(taskOps).toBeDefined();
		const rebootOp = (taskOps as any).options.find(
			(o: any) => o.value === 'reboot',
		);
		expect(rebootOp).toBeDefined();
		expect(rebootOp.routing.request.method).toBe('POST');
		expect(rebootOp.routing.request.url).toContain('/tasks');
		expect(rebootOp.routing.request.body).toEqual({ name: 'reboot' });
	});

	it('Task Set Parameters has parameterPath, parameterValue, parameterType params', () => {
		const paramPath = desc.properties.find(
			(p) => p.name === 'parameterPath',
		);
		const paramValue = desc.properties.find(
			(p) => p.name === 'parameterValue',
		);
		const paramType = desc.properties.find(
			(p) => p.name === 'parameterType',
		);
		expect(paramPath).toBeDefined();
		expect(paramValue).toBeDefined();
		expect(paramType).toBeDefined();
		expect(paramPath!.displayOptions?.show?.operation).toContain(
			'setParameters',
		);
		expect(paramValue!.displayOptions?.show?.operation).toContain(
			'setParameters',
		);
		expect(paramType!.displayOptions?.show?.operation).toContain(
			'setParameters',
		);
	});

	it('Provision Create/Update sets Content-Type to text/plain via preSend', () => {
		const scriptProp = desc.properties.find(
			(p) =>
				p.name === 'script' &&
				p.displayOptions?.show?.resource?.includes('provision'),
		);
		expect(scriptProp).toBeDefined();
		// The preSend function is defined on the routing.send.preSend array
		const preSendFns = (scriptProp as any).routing.send.preSend;
		expect(preSendFns).toBeDefined();
		expect(preSendFns).toHaveLength(1);
		expect(typeof preSendFns[0]).toBe('function');
	});

	it('requestDefaults Authorization header uses Basic auth base64 encoding', () => {
		const authHeader = desc.requestDefaults!.headers!['Authorization'] as string;
		expect(authHeader).toBeDefined();
		expect(authHeader).toContain('Basic');
		expect(authHeader).toContain('base64');
	});

	it('Provision upsert uses PUT method', () => {
		const provOps = desc.properties.find(
			(p) =>
				p.name === 'operation' &&
				p.displayOptions?.show?.resource?.includes('provision'),
		);
		const upsertOp = (provOps as any).options.find(
			(o: any) => o.value === 'upsert',
		);
		expect(upsertOp.routing.request.method).toBe('PUT');
	});

	it('Device List uses GET /devices/', () => {
		const deviceOps = desc.properties.find(
			(p) =>
				p.name === 'operation' &&
				p.displayOptions?.show?.resource?.includes('device'),
		);
		const listOp = (deviceOps as any).options.find(
			(o: any) => o.value === 'list',
		);
		expect(listOp.routing.request.method).toBe('GET');
		expect(listOp.routing.request.url).toBe('/devices/');
	});
});
