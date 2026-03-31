# n8n-nodes-genieacs

n8n community node for [GenieACS](https://genieacs.com/) — TR-069 device management, provisioning, and monitoring.

## Features

### GenieACS Node

| Resource     | Operations                                                                 |
|-------------|---------------------------------------------------------------------------|
| **Device**  | List, Get, Delete                                                          |
| **Task**    | List, Reboot, Factory Reset, Get Parameters, Set Parameters, Refresh Object, Download File, Retry, Delete |
| **Tag**     | Add, Remove                                                                |
| **Fault**   | List, Delete                                                               |
| **Preset**  | List, Create/Update, Delete                                                |
| **Provision** | List, Create/Update, Delete                                              |
| **File**    | List, Delete                                                               |

### GenieACS Trigger

Polling trigger that fires on:

- **New Fault** — detects new faults reported by CPE devices
- **New Device** — detects new devices connecting to GenieACS

## Credentials

Configure credentials with:

| Field    | Description                            |
|----------|----------------------------------------|
| URL      | GenieACS NBI URL (default `http://localhost:7557`) |
| Username | HTTP Basic Auth username                |
| Password | HTTP Basic Auth password                |

## Installation

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes**
2. Select **Install a community node**
3. Enter `n8n-nodes-genieacs`
4. Agree to the risks and install

### Manual

```bash
cd ~/.n8n
npm install n8n-nodes-genieacs
```

## License

[GPL-3.0](LICENSE)
