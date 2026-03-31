import { describe, it, expect, vi } from 'vitest';
import { GenieAcsTrigger } from '../nodes/GenieAcs/GenieAcsTrigger.node';

function createMockContext(
	params: Record<string, any>,
	staticData: Record<string, any>,
	httpResponse: any,
) {
	return {
		getNodeParameter: (name: string, fallback?: any) =>
			params[name] ?? fallback,
		getWorkflowStaticData: () => staticData,
		helpers: {
			httpRequest: vi.fn().mockResolvedValue(httpResponse),
		},
		getCredentials: vi
			.fn()
			.mockResolvedValue({
				url: 'http://localhost:7557',
				username: 'admin',
				password: 'secret',
			}),
	};
}

describe('GenieAcsTrigger Node', () => {
	const trigger = new GenieAcsTrigger();

	it('has correct node name', () => {
		expect(trigger.description.name).toBe('genieAcsTrigger');
	});

	it('is a polling trigger', () => {
		expect(trigger.description.polling).toBe(true);
	});

	it('first poll seeds state and returns null (newFault)', async () => {
		const staticData: Record<string, any> = {};
		const ctx = createMockContext(
			{ event: 'newFault', limit: 50 },
			staticData,
			[{ _id: 'fault-1', message: 'timeout' }],
		);

		const result = await trigger.poll.call(ctx as any);

		expect(result).toBeNull();
		expect(staticData['knownFaultIds']).toEqual(['fault-1']);
	});

	it('subsequent poll with new fault ID emits event', async () => {
		const staticData: Record<string, any> = {
			knownFaultIds: ['fault-1'],
		};
		const ctx = createMockContext(
			{ event: 'newFault', limit: 50 },
			staticData,
			[
				{ _id: 'fault-1', message: 'timeout' },
				{ _id: 'fault-2', message: 'connection refused' },
			],
		);

		const result = await trigger.poll.call(ctx as any);

		expect(result).not.toBeNull();
		expect(result!).toHaveLength(1);
		expect(result![0]).toHaveLength(1);
		expect(result![0][0].json._id).toBe('fault-2');
		expect(staticData['knownFaultIds']).toEqual(['fault-1', 'fault-2']);
	});

	it('first poll seeds state and returns null (newDevice)', async () => {
		const staticData: Record<string, any> = {};
		const ctx = createMockContext(
			{ event: 'newDevice', limit: 50 },
			staticData,
			[{ _id: 'device-001' }],
		);

		const result = await trigger.poll.call(ctx as any);

		expect(result).toBeNull();
		expect(staticData['knownDeviceIds']).toEqual(['device-001']);
	});

	it('subsequent poll with new device ID emits event', async () => {
		const staticData: Record<string, any> = {
			knownDeviceIds: ['device-001'],
		};
		const ctx = createMockContext(
			{ event: 'newDevice', limit: 50 },
			staticData,
			[{ _id: 'device-001' }, { _id: 'device-002' }],
		);

		const result = await trigger.poll.call(ctx as any);

		expect(result).not.toBeNull();
		expect(result![0]).toHaveLength(1);
		expect(result![0][0].json._id).toBe('device-002');
	});

	it('returns null when no new items appear', async () => {
		const staticData: Record<string, any> = {
			knownFaultIds: ['fault-1'],
		};
		const ctx = createMockContext(
			{ event: 'newFault', limit: 50 },
			staticData,
			[{ _id: 'fault-1' }],
		);

		const result = await trigger.poll.call(ctx as any);

		expect(result).toBeNull();
	});
});
