/** @module essential-config */

import path from "path"
import fs from "fs"

import fss from "@absolunet/fss"
import appFolder from "app-folder"
import {difference, sortBy, isEmpty} from "lodash"
import sortKeys from "sort-keys"
import jsYaml from "js-yaml"
import {ensureArray} from "magina"
import prependToLines from "prepend-to-lines"

const writeYaml = config => jsYaml.safeDump(config |> sortKeys, {
  lineWidth: 160,
  noArrayIndent: true,
  noCompatMode: true,
  noRefs: true,
})

/**
 * @typedef {Object} Options
 * @prop {Object<string, *>} defaults
 * @prop {string[]} sensitiveKeys
 */

/**
 * @typedef {Object} Result
 * @prop {Object<string, *>} config
 * @prop {string} configFolder
 * @prop {string} configFile
 * @prop {string[]} deprecatedKeys
 * @prop {string[]} newKeys
 */

/**
 * @param {string|string[]} name
 * @param {Options} options
 * @return {Result}
 */
export default (name, {defaults = {}, sensitiveKeys = []}) => {
  const configFolder = appFolder(...ensureArray(name))
  const configFile = path.join(configFolder, "config.yml")
  let config
  if (!fs.existsSync(configFile)) {
    config = {}
  } else {
    config = fss.readYaml(configFile) || {}
  }
  const givenKeys = Object.keys(config)
  const defaultKeys = Object.keys(defaults)
  const neededKeys = [...defaultKeys, ...sensitiveKeys]
  const missingKeys = difference(neededKeys, givenKeys)
  const deprecatedKeys = difference(givenKeys, neededKeys)
  for (const missingKey of missingKeys) {
    config[missingKey] = defaults[missingKey]
  }
  const configEntries = {
    main: {
      comment: "Configuration",
    },
    sensitive: {
      comment: "Sensitive (keep secret)",
    },
    deprecated: {
      comment: "Deprecated options (no longer used by app)",
    },
  }
  const mainKeys = defaultKeys.filter(key => !sensitiveKeys.includes(key))
  configEntries.main.entries = mainKeys.map(key => ({
    key,
    value: givenKeys.includes(key) ? config[key] : defaults[key],
    header: `Option ${key}\nDefault: ${JSON.stringify(defaults[key], null, 2)}`,
  }))
  configEntries.sensitive.entries = sensitiveKeys.map(key => ({
    key,
    value: givenKeys.includes(key) ? config[key] : defaults[key] || "ENTER",
    header: `Option ${key} (sensitive)`,
  }))
  configEntries.deprecated.entries = deprecatedKeys.map(key => ({
    key,
    value: config[key],
    header: `Option ${key} (deprecated)`,
  }))
  if (config |> isEmpty) {
    return {
      config: null,
      configFile,
      configFolder,
      deprecatedKeys,
      newKeys: missingKeys,
    }
  }
  const yamlContent = Object.values(configEntries).filter(({entries}) => entries.length).map(({entries, comment}) => {
    const entriesString = sortBy(entries, "key").map(({header, value, key}) => `${prependToLines(header, "# ")}\n${{[key]: value} |> writeYaml}`).join("\n")
    const commentLines = "#".repeat(comment.length + 6 + 2)
    return `${commentLines}\n### ${comment} ###\n${commentLines}\n\n${entriesString}`
  }).join("\n")
  fss.outputFile(configFile, yamlContent, "utf8")
  return {
    config,
    configFile,
    configFolder,
    deprecatedKeys,
    newKeys: missingKeys,
  }
}