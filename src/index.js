/** @module essential-config */

import path from "path"

import fss from "@absolunet/fss"
import appFolder from "app-folder"
import {difference, sortBy, isEmpty} from "lodash"
import {ensureArray} from "magina"
import prependToLines from "prepend-to-lines"
import stringifyYaml from "lib/stringifyYaml"
import json5 from "json5"

import ConfigPlan from "./ConfigPlan"

/**
 * @typedef {Object} Options
 * @prop {Object<string, FieldDescription>} fields
 * @prop {Object<string, *>} defaults
 * @prop {string[]} secretKeys
 */

/**
 * @typedef {Object} Result
 * @prop {Object<string, *>} config
 * @prop {string} configFolder
 * @prop {string[]} deprecatedKeys
 * @prop {string[]} newKeys
 * @prop {string[]} givenKeys
 * @prop {ConfigPlan} configPlan
 */

/**
 * @param {import("./ConfigPlan").Options} options
 * @return {ConfigPlan}
 */
export const createConfigPlan = options => {
  return new ConfigPlan(options)
}

/**
 * @param {string|string[]} name
 * @param {Options} options
 * @return {Result}
 */
export default (name, options) => {
  const configPlan = createConfigPlan(options)
  /**
   * @type {string}
   */
  const configFolder = appFolder(...ensureArray(name))
  const categories = [
    {
      name: "basic",
      keys: configPlan.getNonSecretKeys(),
      fileName: "config.yml",
    },
    {
      name: "secret",
      keys: configPlan.getSecretKeys(),
      fileName: "secrets.yml",
    },
  ]
  const result = {
    configPlan,
    configFolder,
    config: {},
    givenKeys: [],
    newKeys: [],
    deprecatedKeys: [],
  }
  for (const {keys, fileName} of categories) {
    if (isEmpty(keys)) {
      continue
    }
    const file = path.join(configFolder, fileName)
    const fileExists = fss.pathExists(file)
    const config = fileExists ? fss.readYaml(file) || {} : {}
    const givenKeys = Object.keys(config)
    const missingKeys = difference(keys, givenKeys)
    const deprecatedKeys = difference(givenKeys, keys)
    for (const missingKey of missingKeys) {
      const {defaultValue} = configPlan.fields[missingKey]
      config[missingKey] = defaultValue || ""
    }
    const fileEntries = []
    for (const key of sortBy(keys)) {
      const field = configPlan.fields[key]
      let header = `Option ${key}`
      if (field.defaultValue !== undefined) {
        header += "\nDefault: "
        header += json5.stringify(field.defaultValue, null, 2)
      }
      fileEntries.push({
        key,
        value: config[key],
        header,
      })
    }
    for (const key of sortBy(deprecatedKeys)) {
      const header = `Deprecated option ${key}\nThis option is no longer needed and can be safely removed.`
      fileEntries.push({
        key,
        value: config[key],
        header,
      })
    }
    const yamlContent = fileEntries.map(({key, value, header}) => {
      const yamlObject = {[key]: value}
      const comment = prependToLines(header, "# ")
      return `${comment}\n${stringifyYaml(yamlObject)}`
    }).join("\n")
    fss.outputFile(file, yamlContent, "utf8")
    Object.assign(result.config, config)
    Array.prototype.push.apply(result.givenKeys, givenKeys)
    Array.prototype.push.apply(result.deprecatedKeys, deprecatedKeys)
    Array.prototype.push.apply(result.newKeys, missingKeys)
  }
  return result
}