import path from "path"
import fs from "fs"

import fss from "@absolunet/fss"
import appFolder from "app-folder"
import {difference, sortBy, isEmpty} from "lodash"
import sortKeys from "sort-keys"
import jsYaml from "js-yaml"
import {ensureArray} from "magina"

const writeYaml = config => jsYaml.safeDump(config |> sortKeys, {
  lineWidth: 160,
  noArrayIndent: true,
  noCompatMode: true,
  noRefs: true,
})

export default (name, defaultConfig) => {
  const configFolder = appFolder(...ensureArray(name))
  const configFile = path.join(configFolder, "config.yml")
  let config
  if (!fs.existsSync(configFile)) {
    config = {}
  } else {
    config = fss.readYaml(configFile) || {}
  }
  const givenKeys = Object.keys(config)
  const defaultKeys = Object.keys(defaultConfig)
  const missingKeys = difference(defaultKeys, givenKeys)
  const deprecatedKeys = difference(givenKeys, defaultKeys)
  for (const missingKey of missingKeys) {
    config[missingKey] = defaultConfig[missingKey]
  }
  let yamlContent = ""
  const configEntries = []
  for (const key of defaultKeys |> sortBy) {
    let string = `# Option ${key}\n`
    const value = givenKeys.includes(key) ? config[key] : defaultConfig[key]
    string += `# Default ${JSON.stringify(defaultConfig[key], null, 2).replace(/\n/gs, "\n# ")}\n`
    string += writeYaml({[key]: value}).trim()
    configEntries.push(string)
  }
  if (!isEmpty(configEntries)) {
    yamlContent += "### Configuration\n\n"
    yamlContent += configEntries.join("\n\n")
  }
  const deprecatedEntries = []
  for (const key of deprecatedKeys |> sortBy) {
    let string = `# Option ${key}\n`
    string += writeYaml({[key]: config[key]}).trim()
    deprecatedEntries.push(string)
  }
  if (!isEmpty(deprecatedEntries)) {
    yamlContent += "\n\n### Deprecated options (no longer used by app)\n\n"
    yamlContent += deprecatedEntries.join("\n\n")
  }
  fss.outputFile(configFile, yamlContent, "utf8")
  if (config |> isEmpty) {
    return false
  }
  config.configFolder = configFolder
  config.configFile = configFile
  return config
}