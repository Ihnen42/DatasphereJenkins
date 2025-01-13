# Datasphere CLI sample

This project samples how to use and integrate Datasphere CLI.

## Getting Started

### Prerequisites

-   Node.js (version >= 20)
-   Datasphere CLI (version >= 2024.6.0)

For Datasphere CLI, please refer to:

-   [Accessing SAP Datasphere via the Command Line](https://help.sap.com/docs/SAP_DATASPHERE/d0ecd6f297ac40249072a44df0549c1a/3f9a42ccde6b4b6aba121e2aab79c36d.html)

### 1. Clone the repository

```sh
git clone https://github.wdf.sap.corp/I575730/datasphere-cli-sample.git
cd datasphere-cli-sample

```

### 2. Install npm dependencies

```sh
npm install
```

### 3. Copy the environment variables to `.env`

```shell
cp .env.example .env
```

### 4. Configure the variables in `.env`

#### Source Datasphere tenant configuration

| Variable                          | Value                                            |
| --------------------------------- | ------------------------------------------------ |
| SOURCE_TENANT_HOST                | < Source Datasphere tenant host URL >            |
| SOURCE_TENANT_AUTHORIZATION_URL   | < Source Datasphere tenant authorization URL >   |
| SOURCE_TENANT_TOKEN_URL           | < Source Datasphere tenant token URL >           |
| SOURCE_TENANT_OAUTH_CLIENT_ID     | < Source Datasphere tenant oAuth Client id >     |
| SOURCE_TENANT_OAUTH_CLIENT_SECRET | < Source Datasphere tenant oAuth Client secret > |
| SOURCE_TENANT_SPACE               | < Source Datasphere tenant space >               |

#### Target Datasphere tenant configuration

| Variable                          | Value                                            |
| --------------------------------- | ------------------------------------------------ |
| TARGET_TENANT_HOST                | < Target Datasphere tenant host URL >            |
| TARGET_TENANT_AUTHORIZATION_URL   | < Target Datasphere tenant authorization URL >   |
| TARGET_TENANT_TOKEN_URL           | < Target Datasphere tenant token URL >           |
| TARGET_TENANT_OAUTH_CLIENT_ID     | < Target Datasphere tenant oAuth Client id >     |
| TARGET_TENANT_OAUTH_CLIENT_SECRET | < Target Datasphere tenant oAuth Client secret > |
| TARGET_TENANT_SPACE               | < Target Datasphere tenant space >               |

#### (Optional) Browser for oAuth interactive authentication

| Variable | Value       |
| -------- | ----------- |
| BROWSER  | < Browser > |

### 5. Run the sample

```sh
node src/download-objects-from-a-space.js
node src/upload-objects-to-a-space.js
node src/download-and-upload-objects-in-cross-tenant.js
```
