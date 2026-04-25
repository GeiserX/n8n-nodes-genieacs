import { describe, it, expect } from 'vitest';
import { GenieAcs } from '../nodes/GenieAcs/GenieAcs.node';

const node = new GenieAcs();
const desc = node.description;

// Helper: find a property by name + optional resource/operation filter
function findProp(name: string, filters?: { resource?: string; operation?: string }) {
	return desc.properties.find((p) => {
		if (p.name !== name) return false;
		if (filters?.resource && !(p.displayOptions?.show?.resource as string[])?.includes(filters.resource)) return false;
		if (filters?.operation && !(p.displayOptions?.show?.operation as string[])?.includes(filters.operation)) return false;
		return true;
	});
}

// Helper: find operation property for a resource
function getOpsForResource(resource: string) {
	return desc.properties.find(
		(p) =>
			p.name === 'operation' &&
			(p.displayOptions?.show?.resource as string[])?.includes(resource),
	);
}

// Helper: create a mock preSend context
function createPreSendContext(params: Record<string, any>) {
	return {
		getNodeParameter: (name: string, fallback?: any) => params[name] ?? fallback,
	};
}

// ---------------------------------------------------------------------------
// Node metadata
// ---------------------------------------------------------------------------
describe('GenieAcs Node', () => {
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
				'device', 'task', 'tag', 'fault', 'preset', 'provision', 'file',
			]),
		);
		expect(values).toHaveLength(7);
	});

	it('requestDefaults Authorization header uses Basic auth base64 encoding', () => {
		const authHeader = desc.requestDefaults!.headers!['Authorization'] as string;
		expect(authHeader).toBeDefined();
		expect(authHeader).toContain('Basic');
		expect(authHeader).toContain('base64');
	});
});

// ---------------------------------------------------------------------------
// Operations per resource
// ---------------------------------------------------------------------------
describe('Device operations', () => {
	const ops = getOpsForResource('device');
	it('has list, get, delete', () => {
		const values = (ops as any).options.map((o: any) => o.value);
		expect(values).toHaveLength(3);
		expect(values).toEqual(expect.arrayContaining(['list', 'get', 'delete']));
	});
	it('List uses GET /devices/', () => {
		const listOp = (ops as any).options.find((o: any) => o.value === 'list');
		expect(listOp.routing.request.method).toBe('GET');
		expect(listOp.routing.request.url).toBe('/devices/');
	});
});

describe('Task operations', () => {
	const ops = getOpsForResource('task');
	it('has 9 operations', () => {
		expect((ops as any).options).toHaveLength(9);
	});
	it('Reboot sends POST with body name=reboot', () => {
		const op = (ops as any).options.find((o: any) => o.value === 'reboot');
		expect(op.routing.request.method).toBe('POST');
		expect(op.routing.request.body).toEqual({ name: 'reboot' });
	});
	it('Factory Reset sends body name=factoryReset', () => {
		const op = (ops as any).options.find((o: any) => o.value === 'factoryReset');
		expect(op.routing.request.body).toEqual({ name: 'factoryReset' });
	});
	it('has parameterPath, parameterValue, parameterType params', () => {
		expect(findProp('parameterPath')).toBeDefined();
		expect(findProp('parameterValue')).toBeDefined();
		expect(findProp('parameterType')).toBeDefined();
	});
});

describe('Tag operations', () => {
	const ops = getOpsForResource('tag');
	it('has add and remove', () => {
		const values = (ops as any).options.map((o: any) => o.value);
		expect(values).toEqual(expect.arrayContaining(['add', 'remove']));
	});
	it('Add uses POST, Remove uses DELETE', () => {
		const addOp = (ops as any).options.find((o: any) => o.value === 'add');
		const removeOp = (ops as any).options.find((o: any) => o.value === 'remove');
		expect(addOp.routing.request.method).toBe('POST');
		expect(removeOp.routing.request.method).toBe('DELETE');
	});
});

describe('Fault operations', () => {
	const ops = getOpsForResource('fault');
	it('has list and delete', () => {
		const values = (ops as any).options.map((o: any) => o.value);
		expect(values).toEqual(expect.arrayContaining(['list', 'delete']));
	});
});

describe('Preset operations', () => {
	const ops = getOpsForResource('preset');
	it('Upsert uses PUT', () => {
		const op = (ops as any).options.find((o: any) => o.value === 'upsert');
		expect(op.routing.request.method).toBe('PUT');
	});
});

describe('Provision operations', () => {
	const ops = getOpsForResource('provision');
	it('Upsert uses PUT', () => {
		const op = (ops as any).options.find((o: any) => o.value === 'upsert');
		expect(op.routing.request.method).toBe('PUT');
	});
	it('script prop has preSend function', () => {
		const scriptProp = findProp('script', { resource: 'provision' });
		const preSendFns = (scriptProp as any).routing.send.preSend;
		expect(preSendFns).toHaveLength(1);
		expect(typeof preSendFns[0]).toBe('function');
	});
});

describe('File operations', () => {
	const ops = getOpsForResource('file');
	it('has list and delete', () => {
		const values = (ops as any).options.map((o: any) => o.value);
		expect(values).toEqual(expect.arrayContaining(['list', 'delete']));
	});
});

// ---------------------------------------------------------------------------
// preSend: query filters
// ---------------------------------------------------------------------------
describe('preSend — query filters', () => {
	const queryProps = desc.properties.filter(
		(p) => p.name === 'query' && (p as any).routing?.send?.preSend,
	);

	it('device query: adds qs.query when non-empty', async () => {
		const prop = queryProps.find((p) => (p.displayOptions?.show?.resource as string[])?.includes('device'));
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ query: '{"_tags":"home"}' }), { qs: {} });
		expect(result.qs.query).toBe('{"_tags":"home"}');
	});

	it('device query: no-op when empty', async () => {
		const prop = queryProps.find((p) => (p.displayOptions?.show?.resource as string[])?.includes('device'));
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ query: '' }), {});
		expect(result.qs).toBeUndefined();
	});

	it('task query: adds qs.query when non-empty', async () => {
		const prop = queryProps.find((p) => (p.displayOptions?.show?.resource as string[])?.includes('task'));
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ query: '{"device":"abc"}' }), {});
		expect(result.qs.query).toBe('{"device":"abc"}');
	});

	it('fault query: adds qs.query', async () => {
		const prop = queryProps.find((p) => (p.displayOptions?.show?.resource as string[])?.includes('fault'));
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ query: '{"code":"err"}' }), { qs: {} });
		expect(result.qs.query).toBe('{"code":"err"}');
	});

	it('file query: adds qs.query', async () => {
		const prop = queryProps.find((p) => (p.displayOptions?.show?.resource as string[])?.includes('file'));
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ query: '{"type":"fw"}' }), {});
		expect(result.qs.query).toBe('{"type":"fw"}');
	});
});

// ---------------------------------------------------------------------------
// preSend: projection
// ---------------------------------------------------------------------------
describe('preSend — projection', () => {
	it('adds qs.projection when non-empty', async () => {
		const prop = findProp('projection', { resource: 'device' });
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ projection: '_id,_deviceId' }), {});
		expect(result.qs.projection).toBe('_id,_deviceId');
	});

	it('no-op when empty', async () => {
		const prop = findProp('projection', { resource: 'device' });
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ projection: '' }), {});
		expect(result.qs).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// preSend: connectionRequest
// ---------------------------------------------------------------------------
describe('preSend — connectionRequest', () => {
	it('adds connection_request to qs when true', async () => {
		const prop = findProp('connectionRequest', { resource: 'task' });
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ connectionRequest: true }), {});
		expect(result.qs.connection_request).toBe('');
	});

	it('no-op when false', async () => {
		const prop = findProp('connectionRequest', { resource: 'task' });
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ connectionRequest: false }), {});
		expect(result.qs).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// preSend: timeout
// ---------------------------------------------------------------------------
describe('preSend — timeout', () => {
	it('adds timeout to qs when > 0', async () => {
		const prop = findProp('timeout', { resource: 'task' });
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ timeout: 5000 }), {});
		expect(result.qs.timeout).toBe('5000');
	});

	it('no-op when 0', async () => {
		const prop = findProp('timeout', { resource: 'task' });
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ timeout: 0 }), {});
		expect(result.qs).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// preSend: getParameters (parameterNames)
// ---------------------------------------------------------------------------
describe('preSend — parameterNames', () => {
	it('builds body with parsed parameter names', async () => {
		const prop = findProp('parameterNames', { operation: 'getParameters' });
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ parameterNames: 'Device.Info,Device.WiFi' }), {});
		expect(result.body).toEqual({
			name: 'getParameterValues',
			parameterNames: ['Device.Info', 'Device.WiFi'],
		});
	});
});

// ---------------------------------------------------------------------------
// preSend: setParameters
// ---------------------------------------------------------------------------
describe('preSend — setParameters', () => {
	it('builds body with parameterValues triple', async () => {
		const prop = findProp('parameterType', { operation: 'setParameters' });
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({
			parameterPath: 'Device.WiFi.Channel',
			parameterValue: '6',
			parameterType: 'xsd:unsignedInt',
		}), {});
		expect(result.body).toEqual({
			name: 'setParameterValues',
			parameterValues: [['Device.WiFi.Channel', '6', 'xsd:unsignedInt']],
		});
	});
});

// ---------------------------------------------------------------------------
// preSend: configurations (preset upsert)
// ---------------------------------------------------------------------------
describe('preSend — configurations', () => {
	it('parses JSON and sets body.configurations', async () => {
		const prop = findProp('configurations', { operation: 'upsert' });
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ configurations: '[{"type":"provision"}]' }), { body: {} });
		expect(result.body.configurations).toEqual([{ type: 'provision' }]);
	});

	it('handles null body', async () => {
		const prop = findProp('configurations', { operation: 'upsert' });
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ configurations: '[]' }), {});
		expect(result.body.configurations).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// preSend: script (provision upsert)
// ---------------------------------------------------------------------------
describe('preSend — script', () => {
	it('sets body to script and Content-Type to text/plain', async () => {
		const prop = findProp('script', { resource: 'provision' });
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ script: 'log("hi");' }), { headers: {} });
		expect(result.body).toBe('log("hi");');
		expect(result.headers['Content-Type']).toBe('text/plain');
	});

	it('initializes headers when not present', async () => {
		const prop = findProp('script', { resource: 'provision' });
		const fn = (prop as any).routing.send.preSend[0];
		const result = await fn.call(createPreSendContext({ script: 'code()' }), {});
		expect(result.body).toBe('code()');
		expect(result.headers['Content-Type']).toBe('text/plain');
	});
});
