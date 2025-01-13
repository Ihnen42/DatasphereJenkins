/* Copyright 2024 SAP SE or an SAP affiliate company. All rights reserved. */

/**
 * This script will download all of the objects from the source space,
 * and upload them into the target space of a different tenant.
 */

const fs = require('fs')
const path = require('path')
const { homedir } = require('os')
const datasphereCli = require('./datasphere/cli')
const {
    setupCli,
    isCmdNotSupported,
    isTimeDimensionObject,
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
 * and then set up the CLI for the source tenant and the target tenant
 */
const sourceTenantConfig = loadTenantConfig('SOURCE_TENANT_')
const targetTenantConfig = loadTenantConfig('TARGET_TENANT_')
logStart('Set up CLI for the source tenant and the target tenant')
setupCli(sourceTenantConfig)
setupCli(targetTenantConfig)
logEnd('Finish the setup.')

/**
 * Step 1:
 * List all objects in the source space,
 * and group them by the object type command.
 */
datasphereCli.config.host.set(sourceTenantConfig.host) // Switch to the source tenant
const objectTypeGroup = OBJECT_TYPE_COMMANDS.reduce((acc, objectTypeCmd) => {
    acc[objectTypeCmd] = loopToListAllObjects(objectTypeCmd, sourceTenantConfig.space)
    return acc
}, {})

/**
 * Step 2:
 * Download objects from the source space to the output directory.
 * Create the output directory first if it does not exist.
 */
const outputDir = path.join(homedir(), 'SAP_Datasphere', sourceTenantConfig.space)
if (!fs.existsSync(outputDir)) {
    logWarn(`The output directory does not exist, try to create ${outputDir}.`)
    fs.mkdirSync(outputDir, { recursive: true })
}
for (const [objectTypeCmd, objects] of Object.entries(objectTypeGroup)) {
    const objectType = objectTypeCmd.replace(/-/g, ' ')
    logStart(
        `Download ${objectType} from the source space ${sourceTenantConfig.space} to the output directory ${outputDir}`
    )
    for (const { technicalName, defaultFileName } of objects) {
        let { status, stdout } = datasphereCli.objects.read(objectTypeCmd, {
            space: sourceTenantConfig.space,
            technicalName,
            output: path.join(outputDir, defaultFileName),
        })

        if (isCmdNotSupported(status, stdout)) {
            logWarn(`The command 'datasphere objects ${objectTypeCmd} read' is not supported.`)
            break
        }

        if (status !== 0) {
            logError(`Failed to download ${technicalName} from the source space ${sourceTenantConfig.space}.`)
            console.error(stdout.toString())
            continue
        }
    }
    logEnd(`Finish the download.`)
}

/**
 * Step 3:
 * Upload objects to the target space of a different tenant,
 * and deploy them later (except time dimension objects).
 */
datasphereCli.config.host.set(targetTenantConfig.host) // Switch to the target tenant
for (const [objectTypeCmd, objects] of Object.entries(objectTypeGroup)) {
    const objectType = objectTypeCmd.replace(/-/g, ' ')
    logStart(
        `Upload ${objectType} to the target space ${targetTenantConfig.space} from the JSON files in the output directory ${outputDir}`
    )
    for (const { technicalName, defaultFileName } of objects) {
        k
        let { status, stdout } = datasphereCli.objects.update(objectTypeCmd, {
            space: targetTenantConfig.space,
            technicalName,
            filePath: path.join(outputDir, defaultFileName),
            saveAnyway: true, // To ignore missing dependencies error
            noDeploy: isTimeDimensionObject(technicalName) ? false : true, // Time dimension objects should be deployed, others should deploy later
        })

        if (isCmdNotSupported(status, stdout)) {
            logWarn(`The command 'datasphere objects ${objectTypeCmd} update' is not supported.`)
            break
        }

        if (status !== 0) {
            logError(
                `Failed to upload ${technicalName} to the target space ${targetTenantConfig.space}. Run the script with '--verbose' to see the error.`
            )
            console.error(stdout.toString())
            continue
        }
    }
    logEnd(`Finish the upload.`)
}

/**
 * Step 4:
 * Deploy objects to the target space of a different tenant.
 */
datasphereCli.config.host.set(targetTenantConfig.host) // Switch to the target tenant
for (const [objectTypeCmd, objects] of Object.entries(objectTypeGroup)) {
    const objectType = objectTypeCmd.replace(/-/g, ' ')
    logStart(`Deploy ${objectType} in the target space ${targetTenantConfig.space}`)
    for (const { technicalName, defaultFileName } of objects) {
        // Skip time dimension objects because they have been deployed in the previous step
        if (isTimeDimensionObject(technicalName)) {
            continue
        }

        let { status, stdout } = datasphereCli.objects.update(objectTypeCmd, {
            space: targetTenantConfig.space,
            technicalName,
            filePath: path.join(outputDir, defaultFileName),
            saveAnyway: true,
        })

        if (isCmdNotSupported(status, stdout)) {
            logWarn(`The command 'datasphere objects ${objectTypeCmd} update' is not supported.`)
            break
        }

        if (status !== 0) {
            logError(
                `Failed to deploy ${technicalName} in the target space ${targetTenantConfig.space}. Run the script with '--verbose' to see the error.`
            )
            console.error(stdout.toString())
            continue
        }
    }
    logEnd(`Finish the deployment.`)
}
