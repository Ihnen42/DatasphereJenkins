/* Copyright 2024 SAP SE or an SAP affiliate company. All rights reserved. */

/**
 * This script will upload all of the objects from the JSON files in the object-csn-example directory to the space
 */

const path = require('path')
const datasphereCli = require('./datasphere/cli')
const {
    setupCli,
    isCmdNotSupported,
    logStart,
    logEnd,
    logWarn,
    logError,
    loadTenantConfig,
} = require('./datasphere/utils')

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
 * Upload objects to the space
 */
const objects = [
    { objectTypeCmd: 'local-tables', technicalName: 'LocalTable', fileName: 'LocalTable.local-table.json' },
    { objectTypeCmd: 'views', technicalName: 'View', fileName: 'View.view.json' },
    { objectTypeCmd: 'er-models', technicalName: 'ERModel', fileName: 'ERModel.er-model.json' },
    { objectTypeCmd: 'data-flows', technicalName: 'DataFlow', fileName: 'DataFlow.data-flow.json' },
    { objectTypeCmd: 'task-chains', technicalName: 'TaskChain', fileName: 'TaskChain.task-chain.json' },
    {
        objectTypeCmd: 'intelligent-lookups',
        technicalName: 'IntelligentLookup',
        fileName: 'IntelligentLookup.intelligent-lookup.json',
    },
    { objectTypeCmd: 'types', technicalName: 'Type', fileName: 'Type.type.json' },
    {
        objectTypeCmd: 'data-access-controls',
        technicalName: 'DataAccessControl',
        fileName: 'DataAccessControl.data-access-control.json',
    },
    {
        objectTypeCmd: 'business-entities',
        technicalName: 'BE_LocalTable',
        fileName: 'BE_LocalTable.business-entity.json',
    },
    { objectTypeCmd: 'fact-models', technicalName: 'FM_LocalTable', fileName: 'FM_LocalTable.fact-model.json' },
    {
        objectTypeCmd: 'consumption-models',
        technicalName: 'CM_LocalTable',
        fileName: 'CM_LocalTable.consumption-model.json',
    },
    { objectTypeCmd: 'contexts', technicalName: 'SAP', fileName: 'SAP.context.json' },
    { objectTypeCmd: 'contexts', technicalName: 'SAP.TIME', fileName: 'SAP.TIME.context.json' },
    {
        objectTypeCmd: 'local-tables',
        technicalName: 'SAP.TIME.M_TIME_DIMENSION',
        fileName: 'SAP.TIME.M_TIME_DIMENSION.local-table.json',
    },
    {
        objectTypeCmd: 'local-tables',
        technicalName: 'SAP.TIME.M_TIME_DIMENSION_TDAY',
        fileName: 'SAP.TIME.M_TIME_DIMENSION_TDAY.local-table.json',
    },
    {
        objectTypeCmd: 'local-tables',
        technicalName: 'SAP.TIME.M_TIME_DIMENSION_TMONTH',
        fileName: 'SAP.TIME.M_TIME_DIMENSION_TMONTH.local-table.json',
    },
    {
        objectTypeCmd: 'local-tables',
        technicalName: 'SAP.TIME.M_TIME_DIMENSION_TQUARTER',
        fileName: 'SAP.TIME.M_TIME_DIMENSION_TQUARTER.local-table.json',
    },
    {
        objectTypeCmd: 'views',
        technicalName: 'SAP.TIME.VIEW_DIMENSION_DAY',
        fileName: 'SAP.TIME.VIEW_DIMENSION_DAY.view.json',
    },
    {
        objectTypeCmd: 'views',
        technicalName: 'SAP.TIME.VIEW_DIMENSION_MONTH',
        fileName: 'SAP.TIME.VIEW_DIMENSION_MONTH.view.json',
    },
    {
        objectTypeCmd: 'views',
        technicalName: 'SAP.TIME.VIEW_DIMENSION_QUARTER',
        fileName: 'SAP.TIME.VIEW_DIMENSION_QUARTER.view.json',
    },
    {
        objectTypeCmd: 'views',
        technicalName: 'SAP.TIME.VIEW_DIMENSION_YEAR',
        fileName: 'SAP.TIME.VIEW_DIMENSION_YEAR.view.json',
    },
]
for (const { objectTypeCmd, technicalName, fileName } of objects) {
    logStart(`Upload ${technicalName} to the space ${tenantConfig.space}`)
    const { status, stdout } = datasphereCli.objects.update(objectTypeCmd, {
        space: tenantConfig.space,
        technicalName,
        filePath: path.join(__dirname, '..', 'object-csn-example', fileName),
    })

    if (isCmdNotSupported(status, stdout)) {
        logWarn(`The command 'datasphere objects ${objectTypeCmd} update' is not supported.`)
        break
    }

    if (status !== 0) {
        logError(
            `Failed to upload ${technicalName} in the space ${tenantConfig.space}. Run the script with '--verbose' to see the error.`
        )
        console.error(stdout.toString())
        continue
    }
    logEnd(`Finish the deployment.`)
}
