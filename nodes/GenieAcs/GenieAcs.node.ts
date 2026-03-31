import type { INodeType, INodeTypeDescription } from 'n8n-workflow';

export class GenieAcs implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GenieACS',
		name: 'genieAcs',
		icon: 'file:genieacs.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Manage TR-069 CPE devices, tasks, presets, and provisions via GenieACS NBI',
		defaults: { name: 'GenieACS' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'genieAcsApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.url}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization:
					'={{"Basic " + Buffer.from($credentials.username + ":" + $credentials.password).toString("base64")}}',
			},
		},
		properties: [
			// ------ Resource selector ------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Device', value: 'device' },
					{ name: 'Fault', value: 'fault' },
					{ name: 'File', value: 'file' },
					{ name: 'Preset', value: 'preset' },
					{ name: 'Provision', value: 'provision' },
					{ name: 'Tag', value: 'tag' },
					{ name: 'Task', value: 'task' },
				],
				default: 'device',
			},

			// ===================== DEVICE =====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['device'] } },
				options: [
					{ name: 'Delete', value: 'delete', action: 'Delete a device', routing: { request: { method: 'DELETE', url: '=/devices/{{encodeURIComponent($parameter["deviceId"])}}' } } },
					{ name: 'Get', value: 'get', action: 'Get a device', routing: { request: { method: 'GET', url: '/devices/', qs: { query: '={{"{\\"_id\\":\\"" + $parameter["deviceId"] + "\\"}"}}' } } } },
					{ name: 'List', value: 'list', action: 'List devices', routing: { request: { method: 'GET', url: '/devices/' } } },
				],
				default: 'list',
			},
			{
				displayName: 'Device ID',
				name: 'deviceId',
				type: 'string',
				required: true,
				default: '',
				description: 'The unique device identifier (e.g. 00236A-SagemcomFast5460-SP10A173802UZ)',
				displayOptions: { show: { resource: ['device'], operation: ['get', 'delete'] } },
			},
			{
				displayName: 'Query (JSON)',
				name: 'query',
				type: 'string',
				default: '',
				description:
					'MongoDB-style JSON query filter (e.g. {"_tags":"home"})',
				displayOptions: { show: { resource: ['device'], operation: ['list'] } },
				routing: {
					send: {
						type: 'query',
						property: 'query',
						preSend: [
							async function (this, requestOptions) {
								const q = this.getNodeParameter('query', '') as string;
								if (q) {
									requestOptions.qs = requestOptions.qs ?? {};
									(requestOptions.qs as Record<string, string>)['query'] = q;
								}
								return requestOptions;
							},
						],
					},
				},
			},
			{
				displayName: 'Projection',
				name: 'projection',
				type: 'string',
				default: '',
				description:
					'Comma-separated list of fields to return (e.g. _id,_deviceId._Manufacturer)',
				displayOptions: { show: { resource: ['device'], operation: ['list'] } },
				routing: {
					send: {
						type: 'query',
						property: 'projection',
						preSend: [
							async function (this, requestOptions) {
								const p = this.getNodeParameter('projection', '') as string;
								if (p) {
									requestOptions.qs = requestOptions.qs ?? {};
									(requestOptions.qs as Record<string, string>)['projection'] = p;
								}
								return requestOptions;
							},
						],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 100,
				description: 'Max number of results to return',
				typeOptions: { minValue: 1 },
				displayOptions: { show: { resource: ['device'], operation: ['list'] } },
				routing: { send: { type: 'query', property: 'limit' } },
			},

			// ===================== TASK =====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['task'] } },
				options: [
					{ name: 'Delete', value: 'delete', action: 'Delete a task', routing: { request: { method: 'DELETE', url: '=/tasks/{{$parameter["taskId"]}}' } } },
					{ name: 'Download File', value: 'downloadFile', action: 'Download a file to device', routing: { request: { method: 'POST', url: '=/devices/{{encodeURIComponent($parameter["deviceId"])}}/tasks', body: { name: 'download', file: '={{$parameter["fileId"]}}' } } } },
					{ name: 'Factory Reset', value: 'factoryReset', action: 'Factory reset a device', routing: { request: { method: 'POST', url: '=/devices/{{encodeURIComponent($parameter["deviceId"])}}/tasks', body: { name: 'factoryReset' } } } },
					{ name: 'Get Parameters', value: 'getParameters', action: 'Get parameter values', routing: { request: { method: 'POST', url: '=/devices/{{encodeURIComponent($parameter["deviceId"])}}/tasks' } } },
					{ name: 'List', value: 'list', action: 'List tasks', routing: { request: { method: 'GET', url: '/tasks/' } } },
					{ name: 'Reboot Device', value: 'reboot', action: 'Reboot a device', routing: { request: { method: 'POST', url: '=/devices/{{encodeURIComponent($parameter["deviceId"])}}/tasks', body: { name: 'reboot' } } } },
					{ name: 'Refresh Object', value: 'refreshObject', action: 'Refresh an object tree', routing: { request: { method: 'POST', url: '=/devices/{{encodeURIComponent($parameter["deviceId"])}}/tasks', body: { name: 'refreshObject', objectName: '={{$parameter["objectName"]}}' } } } },
					{ name: 'Retry', value: 'retry', action: 'Retry a failed task', routing: { request: { method: 'POST', url: '=/tasks/{{$parameter["taskId"]}}/retry' } } },
					{ name: 'Set Parameters', value: 'setParameters', action: 'Set parameter values', routing: { request: { method: 'POST', url: '=/devices/{{encodeURIComponent($parameter["deviceId"])}}/tasks' } } },
				],
				default: 'list',
			},
			{
				displayName: 'Device ID',
				name: 'deviceId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['task'],
						operation: [
							'reboot',
							'factoryReset',
							'getParameters',
							'setParameters',
							'refreshObject',
							'downloadFile',
						],
					},
				},
			},
			{
				displayName: 'Task ID',
				name: 'taskId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['task'], operation: ['retry', 'delete'] },
				},
			},
			{
				displayName: 'Parameter Names',
				name: 'parameterNames',
				type: 'string',
				required: true,
				default: '',
				description:
					'Comma-separated TR-069 parameter paths (e.g. Device.DeviceInfo.SoftwareVersion,Device.WiFi.SSID)',
				displayOptions: {
					show: { resource: ['task'], operation: ['getParameters'] },
				},
				routing: {
					send: {
						preSend: [
							async function (this, requestOptions) {
								const raw = this.getNodeParameter('parameterNames', '') as string;
								const names = raw.split(',').map((s) => s.trim()).filter(Boolean);
								requestOptions.body = {
									name: 'getParameterValues',
									parameterNames: names,
								};
								return requestOptions;
							},
						],
					},
				},
			},
			{
				displayName: 'Parameter Path',
				name: 'parameterPath',
				type: 'string',
				required: true,
				default: '',
				description:
					'TR-069 parameter path (e.g. Device.WiFi.Radio.1.Channel)',
				displayOptions: {
					show: { resource: ['task'], operation: ['setParameters'] },
				},
			},
			{
				displayName: 'Parameter Value',
				name: 'parameterValue',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['task'], operation: ['setParameters'] },
				},
			},
			{
				displayName: 'Parameter Type',
				name: 'parameterType',
				type: 'options',
				default: 'xsd:string',
				options: [
					{ name: 'String', value: 'xsd:string' },
					{ name: 'Boolean', value: 'xsd:boolean' },
					{ name: 'Int', value: 'xsd:int' },
					{ name: 'Unsigned Int', value: 'xsd:unsignedInt' },
					{ name: 'DateTime', value: 'xsd:dateTime' },
				],
				displayOptions: {
					show: { resource: ['task'], operation: ['setParameters'] },
				},
				routing: {
					send: {
						preSend: [
							async function (this, requestOptions) {
								const path = this.getNodeParameter('parameterPath', '') as string;
								const value = this.getNodeParameter('parameterValue', '') as string;
								const type = this.getNodeParameter('parameterType', 'xsd:string') as string;
								requestOptions.body = {
									name: 'setParameterValues',
									parameterValues: [[path, value, type]],
								};
								return requestOptions;
							},
						],
					},
				},
			},
			{
				displayName: 'Object Name',
				name: 'objectName',
				type: 'string',
				required: true,
				default: '',
				description:
					'TR-069 object path to refresh (e.g. Device.WiFi.AccessPoint.)',
				displayOptions: {
					show: { resource: ['task'], operation: ['refreshObject'] },
				},
			},
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				required: true,
				default: '',
				description: 'The ID of the file stored in GenieACS to download to the device',
				displayOptions: {
					show: { resource: ['task'], operation: ['downloadFile'] },
				},
			},
			{
				displayName: 'Query (JSON)',
				name: 'query',
				type: 'string',
				default: '',
				description:
					'MongoDB-style JSON filter (e.g. {"device":"deviceId"})',
				displayOptions: { show: { resource: ['task'], operation: ['list'] } },
				routing: {
					send: {
						type: 'query',
						property: 'query',
						preSend: [
							async function (this, requestOptions) {
								const q = this.getNodeParameter('query', '') as string;
								if (q) {
									requestOptions.qs = requestOptions.qs ?? {};
									(requestOptions.qs as Record<string, string>)['query'] = q;
								}
								return requestOptions;
							},
						],
					},
				},
			},
			{
				displayName: 'Connection Request',
				name: 'connectionRequest',
				type: 'boolean',
				default: false,
				description:
					'Whether to initiate a connection request to the device for immediate execution',
				displayOptions: {
					show: {
						resource: ['task'],
						operation: [
							'reboot',
							'factoryReset',
							'getParameters',
							'setParameters',
							'refreshObject',
							'downloadFile',
						],
					},
				},
				routing: {
					send: {
						preSend: [
							async function (this, requestOptions) {
								const cr = this.getNodeParameter('connectionRequest', false) as boolean;
								if (cr) {
									requestOptions.qs = requestOptions.qs ?? {};
									(requestOptions.qs as Record<string, string>)['connection_request'] = '';
								}
								return requestOptions;
							},
						],
					},
				},
			},
			{
				displayName: 'Timeout (ms)',
				name: 'timeout',
				type: 'number',
				default: 0,
				description: 'Task timeout in milliseconds (0 = no timeout)',
				displayOptions: {
					show: {
						resource: ['task'],
						operation: [
							'reboot',
							'factoryReset',
							'getParameters',
							'setParameters',
							'refreshObject',
							'downloadFile',
						],
					},
				},
				routing: {
					send: {
						preSend: [
							async function (this, requestOptions) {
								const t = this.getNodeParameter('timeout', 0) as number;
								if (t > 0) {
									requestOptions.qs = requestOptions.qs ?? {};
									(requestOptions.qs as Record<string, string>)['timeout'] = String(t);
								}
								return requestOptions;
							},
						],
					},
				},
			},

			// ===================== TAG =====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['tag'] } },
				options: [
					{ name: 'Add', value: 'add', action: 'Add a tag to a device', routing: { request: { method: 'POST', url: '=/devices/{{encodeURIComponent($parameter["deviceId"])}}/tags/{{encodeURIComponent($parameter["tag"])}}' } } },
					{ name: 'Remove', value: 'remove', action: 'Remove a tag from a device', routing: { request: { method: 'DELETE', url: '=/devices/{{encodeURIComponent($parameter["deviceId"])}}/tags/{{encodeURIComponent($parameter["tag"])}}' } } },
				],
				default: 'add',
			},
			{
				displayName: 'Device ID',
				name: 'deviceId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['tag'] } },
			},
			{
				displayName: 'Tag',
				name: 'tag',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['tag'] } },
			},

			// ===================== FAULT =====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['fault'] } },
				options: [
					{ name: 'Delete', value: 'delete', action: 'Delete a fault', routing: { request: { method: 'DELETE', url: '=/faults/{{encodeURIComponent($parameter["faultId"])}}' } } },
					{ name: 'List', value: 'list', action: 'List faults', routing: { request: { method: 'GET', url: '/faults/' } } },
				],
				default: 'list',
			},
			{
				displayName: 'Fault ID',
				name: 'faultId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['fault'], operation: ['delete'] },
				},
			},
			{
				displayName: 'Query (JSON)',
				name: 'query',
				type: 'string',
				default: '',
				description: 'MongoDB-style JSON filter',
				displayOptions: {
					show: { resource: ['fault'], operation: ['list'] },
				},
				routing: {
					send: {
						type: 'query',
						property: 'query',
						preSend: [
							async function (this, requestOptions) {
								const q = this.getNodeParameter('query', '') as string;
								if (q) {
									requestOptions.qs = requestOptions.qs ?? {};
									(requestOptions.qs as Record<string, string>)['query'] = q;
								}
								return requestOptions;
							},
						],
					},
				},
			},

			// ===================== PRESET =====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['preset'] } },
				options: [
					{ name: 'Create/Update', value: 'upsert', action: 'Create or update a preset', routing: { request: { method: 'PUT', url: '=/presets/{{encodeURIComponent($parameter["presetName"])}}' } } },
					{ name: 'Delete', value: 'delete', action: 'Delete a preset', routing: { request: { method: 'DELETE', url: '=/presets/{{encodeURIComponent($parameter["presetName"])}}' } } },
					{ name: 'List', value: 'list', action: 'List presets', routing: { request: { method: 'GET', url: '/presets/' } } },
				],
				default: 'list',
			},
			{
				displayName: 'Preset Name',
				name: 'presetName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['preset'], operation: ['upsert', 'delete'] },
				},
			},
			{
				displayName: 'Weight',
				name: 'weight',
				type: 'number',
				default: 0,
				description: 'Preset weight (higher = higher priority)',
				displayOptions: {
					show: { resource: ['preset'], operation: ['upsert'] },
				},
				routing: { send: { type: 'body', property: 'weight' } },
			},
			{
				displayName: 'Precondition',
				name: 'precondition',
				type: 'string',
				default: '',
				description:
					'MongoDB-style filter expression for when the preset applies',
				displayOptions: {
					show: { resource: ['preset'], operation: ['upsert'] },
				},
				routing: { send: { type: 'body', property: 'precondition' } },
			},
			{
				displayName: 'Configurations (JSON)',
				name: 'configurations',
				type: 'json',
				default: '[]',
				description:
					'Array of configuration objects (e.g. [{"type":"provision","name":"myProvision","args":{}}])',
				displayOptions: {
					show: { resource: ['preset'], operation: ['upsert'] },
				},
				routing: {
					send: {
						preSend: [
							async function (this, requestOptions) {
								const raw = this.getNodeParameter('configurations', '[]') as string;
								const body = (requestOptions.body ?? {}) as Record<string, unknown>;
								body['configurations'] = JSON.parse(raw);
								requestOptions.body = body;
								return requestOptions;
							},
						],
					},
				},
			},

			// ===================== PROVISION =====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['provision'] } },
				options: [
					{ name: 'Create/Update', value: 'upsert', action: 'Create or update a provision', routing: { request: { method: 'PUT', url: '=/provisions/{{encodeURIComponent($parameter["provisionName"])}}' } } },
					{ name: 'Delete', value: 'delete', action: 'Delete a provision', routing: { request: { method: 'DELETE', url: '=/provisions/{{encodeURIComponent($parameter["provisionName"])}}' } } },
					{ name: 'List', value: 'list', action: 'List provisions', routing: { request: { method: 'GET', url: '/provisions/' } } },
				],
				default: 'list',
			},
			{
				displayName: 'Provision Name',
				name: 'provisionName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['provision'],
						operation: ['upsert', 'delete'],
					},
				},
			},
			{
				displayName: 'Script',
				name: 'script',
				type: 'string',
				typeOptions: { rows: 10 },
				required: true,
				default: '',
				description: 'Provision JavaScript code',
				displayOptions: {
					show: { resource: ['provision'], operation: ['upsert'] },
				},
				routing: {
					send: {
						preSend: [
							async function (this, requestOptions) {
								const script = this.getNodeParameter('script', '') as string;
								requestOptions.body = script;
								requestOptions.headers = requestOptions.headers ?? {};
								(requestOptions.headers as Record<string, string>)['Content-Type'] = 'text/plain';
								return requestOptions;
							},
						],
					},
				},
			},

			// ===================== FILE =====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['file'] } },
				options: [
					{ name: 'Delete', value: 'delete', action: 'Delete a file', routing: { request: { method: 'DELETE', url: '=/files/{{encodeURIComponent($parameter["filename"])}}' } } },
					{ name: 'List', value: 'list', action: 'List files', routing: { request: { method: 'GET', url: '/files/' } } },
				],
				default: 'list',
			},
			{
				displayName: 'Filename',
				name: 'filename',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['file'], operation: ['delete'] },
				},
			},
			{
				displayName: 'Query (JSON)',
				name: 'query',
				type: 'string',
				default: '',
				description: 'MongoDB-style JSON filter',
				displayOptions: {
					show: { resource: ['file'], operation: ['list'] },
				},
				routing: {
					send: {
						type: 'query',
						property: 'query',
						preSend: [
							async function (this, requestOptions) {
								const q = this.getNodeParameter('query', '') as string;
								if (q) {
									requestOptions.qs = requestOptions.qs ?? {};
									(requestOptions.qs as Record<string, string>)['query'] = q;
								}
								return requestOptions;
							},
						],
					},
				},
			},
		],
	};
}
