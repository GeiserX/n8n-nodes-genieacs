import type {
	IPollFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

interface GenieAcsCredentials {
	url: string;
	username: string;
	password: string;
}

async function pollEndpoint(
	ctx: IPollFunctions,
	baseUrl: string,
	headers: Record<string, string>,
	limit: number,
	endpoint: string,
	stateKey: string,
): Promise<INodeExecutionData[][] | null> {
	const webhookData = ctx.getWorkflowStaticData('node');
	const knownIds = (webhookData[stateKey] as string[] | undefined) ?? [];
	const isFirstPoll = knownIds.length === 0 && webhookData[stateKey] === undefined;

	const response = await ctx.helpers.httpRequest({
		method: 'GET',
		url: `${baseUrl}/${endpoint}/`,
		qs: { limit: String(limit) },
		headers,
		json: true,
	});

	const items = Array.isArray(response) ? response : [];
	const currentIds: string[] = [];

	for (const item of items) {
		const id = (item as IDataObject)._id as string;
		if (id) {
			currentIds.push(id);
		}
	}

	// On first poll, seed state with current IDs without emitting events
	if (isFirstPoll) {
		webhookData[stateKey] = currentIds;
		return null;
	}

	const newItems: INodeExecutionData[] = [];
	for (const item of items) {
		const id = (item as IDataObject)._id as string;
		if (id && !knownIds.includes(id)) {
			newItems.push({ json: item as IDataObject });
		}
	}

	webhookData[stateKey] = currentIds;

	if (newItems.length === 0) {
		return null;
	}

	return [newItems];
}

export class GenieAcsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GenieACS Trigger',
		name: 'genieAcsTrigger',
		icon: 'file:genieacs.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Poll GenieACS for new faults or devices',
		defaults: { name: 'GenieACS Trigger' },
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'genieAcsApi',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'New Device',
						value: 'newDevice',
						description: 'Triggers when a new device appears',
					},
					{
						name: 'New Fault',
						value: 'newFault',
						description: 'Triggers when a new fault is reported',
					},
				],
				default: 'newFault',
				required: true,
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Max number of items to fetch per poll',
				typeOptions: { minValue: 1 },
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const event = this.getNodeParameter('event') as string;
		const limit = this.getNodeParameter('limit', 50) as number;
		const creds = (await this.getCredentials('genieAcsApi')) as unknown as GenieAcsCredentials;
		const baseUrl = creds.url.replace(/\/+$/, '');
		const auth = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');

		const headers: Record<string, string> = {
			Accept: 'application/json',
			Authorization: `Basic ${auth}`,
		};

		if (event === 'newFault') {
			return pollEndpoint(this, baseUrl, headers, limit, 'faults', 'knownFaultIds');
		}

		return pollEndpoint(this, baseUrl, headers, limit, 'devices', 'knownDeviceIds');
	}
}
