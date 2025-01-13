/* Copyright 2024 SAP SE or an SAP affiliate company. All rights reserved. */

/**
 * This script will read all of the objects in the space you specified by the environment variable "SOURCE_TENANT_SPACE"
 * and write them, by default, into separate files in `${homedir()}/SAP_Datasphere/${SOURCE_TENANT_SPACE}`
 */

const fs = require('fs')
const path = require('path')
const { homedir } = require('os')
const datasphereCli = require('./datasphere/cli')
const {
    setupCli,
    isCmdNotSupported,
    OBJECT_TYPE_COMMANDS,
    logStart,
    logEnd,
    logWarn,
    logError,
    loadTenantConfig,
} = require('./datasphere/utils')
const { loopToListAllObjects } = require('./common')

/**
 * Step 0:
 * Load the tenant configuration from environment variables,
 * and then set up the CLI for the tenant
 */
const tenantConfig = loadTenantConfig('SOURCE_TENANT_')
logStart('Set up CLI for the tenant')
setupCli(tenantConfig)
logEnd('Finish the setup.')

/**
 * Step 1:
 * List all objects in the space,
 * and group them by the object type command.
 */
datasphereCli.config.host.set(tenantConfig.host)
const objectTypeGroup = OBJECT_TYPE_COMMANDS.reduce((acc, objectTypeCmd) => {
    acc[objectTypeCmd] = loopToListAllObjects(objectTypeCmd, tenantConfig.space)
    return acc
}, {})

/**
 * Step 2:
 * Download objects from the space to the output directory.
 * Create the output directory first if it does not exist.
 */
const outputDir = path.join('SAP_Datasphere', tenantConfig.space)
if (!fs.existsSync(outputDir)) {
    logWarn(`The output directory does not exist, try to create ${outputDir}.`)
    fs.mkdirSync(outputDir, { recursive: true })
}
for (const [objectTypeCmd, objects] of Object.entries(objectTypeGroup)) {
    const objectType = objectTypeCmd.replace(/-/g, ' ')
    logStart(`Download ${objectType} from the space ${tenantConfig.space} to the output directory ${outputDir}`)
    for (const { technicalName, defaultFileName } of objects) {
        let { status, stdout } = datasphereCli.objects.read(objectTypeCmd, {
            space: tenantConfig.space,
            technicalName,
            output: path.join(outputDir, defaultFileName),
        })

        if (isCmdNotSupported(status, stdout)) {
            logWarn(`The command 'datasphere objects ${objectTypeCmd} read' is not supported.`)
            break
        }

        if (status !== 0) {
            logError(`Failed to download ${technicalName} from the space ${tenantConfig.space}.`)
            console.error(stdout.toString())
            continue
        }
    }
    logEnd(`Finish the download.`)
}
