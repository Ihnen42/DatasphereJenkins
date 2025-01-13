/* Copyright 2024 SAP SE or an SAP affiliate company. All rights reserved. */

const { spawnSync, execSync } = require('node:child_process')

// Print verbose logs if the --verbose flag is provided
const verbose = process.argv.find((arg) => arg.toLowerCase() === '--verbose')

/**
 * Generic execution of the Datasphere CLI command
 *
 * ```sh
 * datasphere <args...>
 * ```
 *
 * @param {string[]} args List of string arguments
 * @param {boolean} usingSpawn Whether to use spawn or exec
 * @returns {SpawnSyncReturns<Buffer>} The result of the command
 */
const datasphere = (args, usingSpawn = true) => {
    // Add the verbose flag if the verbose mode is enabled
    if (verbose) {
        args.push('--verbose')
    }

    // Datasphere CLI command
    const datasphereCmd = `datasphere${process.platform === 'win32' ? '.cmd' : ''}`

    // Check if the datasphere command is in the PATH
    if (spawnSync(process.platform === 'win32' ? 'where' : 'whereis', [datasphereCmd]).status !== 0) {
        throw new Error(
            'The datasphere command is not found in your PATH. You can install it by the following command: npm install -g @sap/datasphere-cli'
        )
    }

    if (usingSpawn) {
        const result = spawnSync(datasphereCmd, args)
        if (verbose) {
            console.debug('-----------------')
            console.debug('VERBOSE:')
            console.debug('[Executed command]', datasphereCmd, args.join(' '))
            console.debug('[Exit code]', result.status)
            console.debug('[Output]', result.output.join('').toString())
            console.debug('-----------------\n')
        }
        return result
    } else {
        let status = 0
        const output = []
        try {
            execSync(`${datasphereCmd} ${args.join(' ')}`)
        } catch (error) {
            status = error.status
            output.push(error.stdout, error.stderr)
            console.log(output.join('').toString())
        } finally {
            if (verbose) {
                console.debug('-----------------')
                console.debug('VERBOSE:')
                console.debug('[Executed command]', datasphereCmd, args.join(' '))
                console.debug('[Exit code]', status)
                console.debug('[Output]', output.join('').toString())
                console.debug('-----------------\n')
            }
            return
        }
    }
}

/**
 * Generic execution of the Datasphere CLI sub command "objects"
 *
 * ```sh
 * datasphere objects <objectTypeCmd> <actionCmd> <args...>
 *
 * @param {string} objectTypeCmd The object type command
 * @param {string} actionCmd The action command
 * @param {string[]} args List of string arguments
 * @returns {SpawnSyncReturns<Buffer>} The result of the command
 */
const datasphereObjects = (objectTypeCmd, actionCmd, args) =>
    datasphere(['objects', objectTypeCmd, actionCmd].concat(args))

/**
 * Append arguments to the list of string arguments
 * @param {string[]} args The list of string arguments
 * @param {Object} [delta={}] The arguments delta
 * @param {Object} [delta.optionalArgs = {}] The optional arguments to be appended
 * @param {Object} [delta.eitherArgs = undefined] The either arguments to be appended
 * @returns {string[]} The list of string arguments
 */
const appendArgs = (args, { optionalArgs = {}, eitherArgs = undefined } = (delta = {})) => {
    for (const [key, value] of Object.entries(optionalArgs)) {
        if (value) {
            args.push(`--${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`)
            if (value !== true) {
                args.push(value)
            }
        }
    }

    if (eitherArgs) {
        let hasEitherArg = false
        for (const [key, value] of Object.entries(eitherArgs)) {
            if (value) {
                args.push(`--${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, value)
                if (value !== true) {
                    args.push(value)
                }
                hasEitherArg = true
                break
            }
        }
        if (!hasEitherArg) {
            throw new Error('One of the either arguments must be provided')
        }
    }
    return args
}

/**
 * Command-Line Interface for SAP Datasphere.
 */
const cli = {
    /**
     * Log in to your account using interactive OAuth authentication
     *
     * ```sh
     * datasphere login --authorization-url <authorizationUrl> --token-url <tokenUrl> --client-id <oAuthClientID> --client-secret <oAuthClientSecret> [--browser <browser>] [--host <host>]
     * ```
     *
     * @param {string} authorizationUrl Authorization url for interactive oauth session authentication
     * @param {string} tokenUrl Token url for interactive oauth session authentication
     * @param {string} oAuthClientID Client id for interactive oauth session authentication
     * @param {string} oAuthClientSecret Client secret for interactive oauth session authentication
     * @param {('chrome'|'edge'|'firefox')} [browser="chrome"] Specifies the browser to open, accepts: chrome, edge, firefox
     * @param {string} [host=undefined] specifies the url where the tenant is hosted
     */
    login: (authorizationUrl, tokenUrl, oAuthClientID, oAuthClientSecret, browser = 'chrome', host = undefined) =>
        datasphere(
            appendArgs(
                [
                    'login',
                    '--authorization-url',
                    authorizationUrl,
                    '--token-url',
                    tokenUrl,
                    '--client-id',
                    `'"${oAuthClientID}"'`,
                    '--client-secret',
                    `'"${oAuthClientSecret}"'`,
                ],
                { optionalArgs: { browser, host } }
            ),
            false
        ),

    /**
     * Log out from your account
     *
     * ```sh
     * datasphere logout [--login-id <loginId>]
     * ```
     *
     * @param {number} [loginId=0] Specifies the login ID
     */
    logout: (loginId = 0) => datasphere(appendArgs(['logout'], { optionalArgs: { loginId } })),

    /**
     * Configure your CLI
     */
    config: {
        /**
         * Configure host properties
         */
        host: {
            /**
             * Set the global host for the CLI
             *
             * ```sh
             * datasphere config host set <host>
             * ```
             *
             * @param {string} host The global host
             */
            set: (host) => datasphere(['config', 'host', 'set', host]),

            /**
             * Clean global host
             * @returns {SpawnSyncReturns<Buffer>} The result of the command
             */
            clean: () => datasphere(['config', 'host', 'clean']),

            /**
             * Show global host
             * @returns {SpawnSyncReturns<Buffer>} The result of the command
             */
            show: () => datasphere(['config', 'host', 'show']),
        },

        /**
         * Work with the local CLI cache
         */
        cache: {
            /**
             * Initialize the local CLI cache
             *
             * ```sh
             * datasphere config cache init [--host <host>]
             * ```
             *
             * @param {string} [host=undefined] The url of the tenant host
             * @returns {SpawnSyncReturns<Buffer>} The result of the command
             */
            init: (host = undefined) => datasphere(appendArgs(['config', 'cache', 'init'], { optionalArgs: { host } })),

            /**
             * Clean the local CLI cache
             *
             * ```sh
             * datasphere config cache
             * ```
             *
             * @returns {SpawnSyncReturns<Buffer>} The result of the command
             */
            clean: () => datasphere(appendArgs(['config', 'cache', 'clean'])),

            /**
             * Show the local CLI cache
             *
             * ```sh
             * datasphere config cache show
             * ```
             *
             * @returns {SpawnSyncReturns<Buffer>} The result of the command
             */
            show: () => datasphere(['config', 'cache', 'show']),
        },
    },

    /**
     * Manage modeling objects
     */
    objects: {
        /**
         * Output a list of the objects in JSON format
         *
         * ```sh
         * datasphere objects <objectTypeCmd> list --space <space> [--select <select>] [--technical-names <technicalNames>] [--filter <filter>] [--top <top>] [--skip <skip>] [--host <host>]
         * ```
         *
         * @param {string} objectTypeCmd The object type command
         * @param {object} args The arguments
         * @param {string} args.space The space ID
         * @param {string} [args.select="technicalName"] Choose the properties to include in the list. Example: "technicalName,status"
         * @param {string} [args.technicalNames=undefined] Filter the list using technical names. Example: "technicalName1,technicalName2"
         * @param {string} [args.filter=undefined] Filter the list using standard OData filter syntax. Example: "technicalName eq 'technicalName1'"
         * @param {number} [args.top=25] Restrict the list to the first <top> objects
         * @param {number} [args.skip=0] Exclude the first <skip> objects when creating the list
         * @param {string} [args.host=undefined] The url of the tenant host
         * @returns {SpawnSyncReturns<Buffer>} The result of the command
         */
        list: (
            objectTypeCmd,
            {
                space,
                select = 'technicalName',
                technicalNames = undefined,
                filter = undefined,
                top = 25,
                skip = 0,
                verbose = undefined,
                host = undefined,
            } = args
        ) =>
            datasphereObjects(
                objectTypeCmd,
                'list',
                appendArgs(['--space', space], {
                    optionalArgs: { select, technicalNames, filter, top, skip, host, verbose },
                })
            ),

        /**
         * Read the JSON definition of an object
         *
         * ```sh
         * datasphere objects <objectTypeCmd> read --space <space> --technical-name <technicalName> [--accept <accept>] [--output <output>] [--host <host>] [--verbose]
         * ```
         *
         * @param {string} objectTypeCmd The object type command
         * @param {object} args The arguments
         * @param {string} args.space The space ID
         * @param {string} args.technicalName The technical name of the object
         * @param {('application/vnd.sap.datasphere.object.content+json'|'application/vnd.sap.datasphere.object.content.design-time+json'|'application/vnd.sap.datasphere.object.content.run-time+json')} [args.accept='application/vnd.sap.datasphere.object.content+json'] Return all content or only design-time or run-time content
         * @param {string} [args.output=undefined] Enter a path to a .json file to write the output to. If you do not include this option, the output will be printed to the command line
         * @param {string} [args.host=undefined] The url of the tenant host
         * @returns {SpawnSyncReturns<Buffer>} The result of the command
         */
        read: (
            objectTypeCmd,
            {
                space,
                technicalName,
                accept = 'application/vnd.sap.datasphere.object.content+json',
                output = undefined,
                host = undefined,
            } = args
        ) =>
            datasphereObjects(
                objectTypeCmd,
                'read',
                appendArgs(['--space', space, '--technical-name', technicalName], {
                    optionalArgs: { accept, output, host },
                })
            ),

        /**
         * Create an object from a JSON file or input string
         *
         * ```sh
         * datasphere objects <objectTypeCmd> create --space <space> (--file-path <filePath> | --input-string <inputString>) [--save-anyway] [--no-deploy] [--host <host>] [--verbose]
         * ```
         *
         * @param {string} objectTypeCmd The object type command
         * @param {object} args The arguments
         * @param {string} args.space The space ID
         * @param {string} [args.filePath=undefined] Specifies the file to use as input for the command
         * @param {string} [args.inputString=undefined] Specifies input as string to use for the command
         * @param {boolean} [args.saveAnyway=undefined] Save the object even if there are validation messages
         * @param {boolean} [args.noDeploy=undefined] Do not deploy the object after saving
         * @param {string} [args.host=undefined] The url of the tenant host
         * @returns {SpawnSyncReturns<Buffer>} The result of the command
         */
        create: (
            objectTypeCmd,
            {
                space,
                filePath = undefined,
                inputString = undefined,
                saveAnyway = undefined,
                noDeploy = undefined,
                host = undefined,
            } = args
        ) =>
            datasphereObjects(
                objectTypeCmd,
                'create',
                appendArgs(['--space', space], {
                    eitherArgs: { filePath, inputString },
                    optionalArgs: { saveAnyway, noDeploy, host },
                })
            ),

        /**
         * Update the properties of an object from a JSON file or input string
         *
         * ```sh
         * datasphere objects <objectTypeCmd> update --space <space> --technical-name <technicalName> (--file-path <filePath> | --input-string <inputString>) [--save-anyway] [--no-deploy] [--host <host>] [--verbose]
         * ```
         *
         * @param {string} objectTypeCmd The object type command
         * @param {object} args The arguments
         * @param {string} args.space The space ID
         * @param {string} args.technicalName The technical name of the object
         * @param {string} [args.filePath=undefined] Specifies the file to use as input for the command
         * @param {string} [args.inputString=undefined] Specifies input as string to use for the command
         * @param {boolean} [args.saveAnyway=undefined] Save the object even if there are validation messages
         * @param {boolean} [args.noDeploy=undefined] Do not deploy the object after saving
         * @param {string} [args.host=undefined] The url of the tenant host
         * @returns {SpawnSyncReturns<Buffer>} The result of the command
         */
        update: (
            objectTypeCmd,
            {
                space,
                technicalName,
                filePath = undefined,
                inputString = undefined,
                saveAnyway = undefined,
                noDeploy = undefined,
                host = undefined,
            } = args
        ) =>
            datasphereObjects(
                objectTypeCmd,
                'update',
                appendArgs(['--space', space, '--technical-name', technicalName], {
                    eitherArgs: { filePath, inputString },
                    optionalArgs: { saveAnyway, noDeploy, host },
                })
            ),

        /**
         * Delete an object
         *
         * ```sh
         * datasphere objects <objectTypeCmd> delete --space <space> --technical-name <technicalName> [--delete-anyway] [--verbose] [--host <host>] [--force]
         * ```
         *
         * @param {string} objectTypeCmd The object type command
         * @param {object} args The arguments
         * @param {string} args.space The space ID
         * @param {string} args.technicalName The technical name of the object
         * @param {boolean} [args.deleteAnyway=undefined] Force the deletion of the object, even if other objects depend on it
         * @param {string} [args.host=undefined] The url of the tenant host
         * @returns {SpawnSyncReturns<Buffer>} The result of the command
         */
        delete: (objectTypeCmd, { space, technicalName, deleteAnyway = undefined, host = undefined } = args) =>
            datasphereObjects(
                objectTypeCmd,
                'delete',
                appendArgs(
                    [
                        '--space',
                        space,
                        '--technical-name',
                        technicalName,
                        '--force' /* SKip the interactive of the deletion confirming */,
                    ],
                    {
                        optionalArgs: { deleteAnyway, host },
                    }
                )
            ),
    },
}

module.exports = cli
