/* Copyright 2024 SAP SE or an SAP affiliate company. All rights reserved. */

const datasphereCli = require('./datasphere/cli')
const { isCmdNotSupported, logStart, logEnd, logWarn, logError } = require('./datasphere/utils')

/**
 * Loop to list all objects of the specified type from the given space
 *
 * @param {string} objectTypeCmd The object type command
 * @param {string} space The space ID
 * @returns {{ technicalName: string, defaultFileName: string }[]} The list of objects
 */
const loopToListAllObjects = (objectTypeCmd, space) => {
    const objectType = objectTypeCmd.replace(/-/g, ' ')
    const objects = []

    logStart(`List ${objectType} from the given space ${space}`)
    let top = 25,
        skip = 0,
        select = 'technicalName,defaultFileName'

    // Loop to get all objects
    while (true) {
        let { status, stdout } = datasphereCli.objects.list(objectTypeCmd, { space, select, top, skip })

        if (isCmdNotSupported(status, stdout)) {
            logWarn(`The command 'datasphere objects ${objectTypeCmd} list' is not supported.`)
            break
        }

        if (status !== 0) {
            logError(
                `Failed to list ${objectType} from the given space ${space}. Run the script with '--verbose' to see the error.`
            )
            console.error(stdout.toString())
            process.exit(status)
        }

        const jsonMatch = stdout.toString().match(/\[[.\s\S]*\]/m)
        const result = JSON.parse(jsonMatch ? jsonMatch[0] : '[]')
        if (result.length === 0) {
            break
        }

        objects.push(...result)
        skip += top
    }

    logEnd(`Found ${objects.length} ${objectType}.`)
    return objects
}

module.exports = { loopToListAllObjects }
