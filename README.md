<p align="center">
  <img src="docs/images/banner.svg" alt="n8n-nodes-genieacs banner" width="900"/>
</p>

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

## Other n8n Community Nodes by GeiserX

- [n8n-nodes-cashpilot](https://github.com/GeiserX/n8n-nodes-cashpilot) — Passive income monitoring
- [n8n-nodes-lynxprompt](https://github.com/GeiserX/n8n-nodes-lynxprompt) — AI configuration blueprints
- [n8n-nodes-pumperly](https://github.com/GeiserX/n8n-nodes-pumperly) — Fuel and EV charging prices
- [n8n-nodes-telegram-archive](https://github.com/GeiserX/n8n-nodes-telegram-archive) — Telegram message archive
- [n8n-nodes-way-cms](https://github.com/GeiserX/n8n-nodes-way-cms) — Web archive content management


## Related Projects

| Project | Description |
|---------|-------------|
| [genieacs-container](https://github.com/GeiserX/genieacs-container) | Original and most popular Helm Chart / Container for GenieACS |
| [genieacs-sim-container](https://github.com/GeiserX/genieacs-sim-container) | Docker for the GenieACS Simulator |
| [genieacs-ha](https://github.com/GeiserX/genieacs-ha) | Home Assistant custom integration for GenieACS TR-069 router management |
| [genieacs-mcp](https://github.com/GeiserX/genieacs-mcp) | MCP Server for GenieACS written in Go |
| [genieacs-ansible](https://github.com/GeiserX/genieacs-ansible) | Ansible Galaxy collection for GenieACS TR-069 ACS |
| [genieacs-services](https://github.com/GeiserX/genieacs-services) | Systemd/Supervisord services for GenieACS processes |

## License

[GPL-3.0](LICENSE)
