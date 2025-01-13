/* Copyright 2024 SAP SE or an SAP affiliate company. All rights reserved. */

const datasphereCli = require('./cli')
require('dotenv').config()

/**
 * Get the mandatory environment variable.
 * @param {string} key The key
 * @returns {string} The value
 */
const getMandatoryEnvVar = (key) => {
    if (!Object.keys(process.env).includes(key)) {
        console.error(`The environment variable ${key} is not set.`)
        process.exit(1)
    }

    return process.env[key]
}

/**
 * Load the tenant configuration from environment variables
 * @param {string} [prefix=''] The prefix of the environment variables
 */
const loadTenantConfig = (prefix = '') => ({
    host: getMandatoryEnvVar(`${prefix}HOST`),
    authorizationUrl: getMandatoryEnvVar(`${prefix}AUTHORIZATION_URL`),
    tokenUrl: getMandatoryEnvVar(`${prefix}TOKEN_URL`),
    oAuthClientID: getMandatoryEnvVar(`${prefix}OAUTH_CLIENT_ID`),
    oAuthClientSecret: getMandatoryEnvVar(`${prefix}OAUTH_CLIENT_SECRET`),
    space: getMandatoryEnvVar(`${prefix}SPACE`),
    browser: process.env.BROWSER,
})

/**
 * Set up the CLI for a tenant
 *
 * @param {object} tenantConfig The tenant configuration
 * @param {string} tenantConfig.host The host
 * @param {string} tenantConfig.authorizationUrl The authorization URL
 * @param {string} tenantConfig.tokenUrl The token URL
 * @param {string} tenantConfig.oAuthClientID The OAuth client ID
 * @param {string} tenantConfig.oAuthClientSecret The OAuth client secret
 * @param {string} tenantConfig.browser The browser
 * @returns {void}
 */
const setupCli = ({ host, authorizationUrl, tokenUrl, oAuthClientID, oAuthClientSecret, browser } = tenantConfig) => {
    // Set the host
    let { status, stdout } = datasphereCli.config.host.set(host)
    if (status !== 0) {
        console.error(stdout.toString())
        process.exit(status)
    }

    // Login to the CLI
    datasphereCli.login(authorizationUrl, tokenUrl, oAuthClientID, oAuthClientSecret, browser)

    // Initialize the cache
    ;({ status, stdout } = datasphereCli.config.cache.init(host))
    if (status !== 0) {
        console.error(stdout.toString())
        process.exit(status)
    }
}

/**
 * Check if the command is not supported
 * @param {number} status The status
 * @param {Buffer} stdout The standard output
 * @returns {boolean} `true` if the command is not supported, `false` otherwise
 */
const isCmdNotSupported = (status, stdout) => status !== 0 && stdout.toString().includes('error: unknown command')

/**
 * Check if the object is a time dimension object
 * @param {string} technicalName The technical name
 * @returns {boolean} `true` if the object is a time dimension object, `false` otherwise
 */
const isTimeDimensionObject = (technicalName) => technicalName.startsWith('SAP.TIME.')

/**
 * Log a warning message
 * @param {string} msg The message
 */
const logWarn = (msg) => console.warn(`[!] ${msg}`)

/**
 * Log an error message
 * @param {string} msg The message
 */
const logError = (msg) => console.error(`[x] ${msg}`)

/**
 * Log a start message
 * @param {string} msg The message
 */
const logStart = (msg) => console.log(`* ${msg}...`)

/**
 * Log an end message
 * @param {string} msg The message
 */
const logEnd = (msg) => console.log(`> ${msg}\n`)

// List of object type commands
const OBJECT_TYPE_COMMANDS = [
    'contexts',
    'types',
    'local-tables',
    'remote-tables',
    'views',
    'intelligent-lookups',
    'er-models',
    'data-flows',
    'transformation-flows',
    'replication-flows',
    'task-chains',
    'analytic-models',
    'data-access-controls',
    'business-entities',
    'fact-models',
    'consumption-models',
]

module.exports = {
    loadTenantConfig,
    setupCli,
    isCmdNotSupported,
    isTimeDimensionObject,
    logStart,
    logEnd,
    logWarn,
    logError,
    OBJECT_TYPE_COMMANDS,
}
