import path from "path"
import fs from "fs"

import fss from "@absolunet/fss"
import appdataPath from "appdata-path"
import {difference} from "lodash"
import sortKeys from "sort-keys"
import jsYaml from "js-yaml"

const writeYaml = config => jsYaml.safeDump(config |> sortKeys, {
  lineWidth: 160,
  noArrayIndent: true,
  noCompatMode: true,
  noRefs: true,
})

export default (name, defaultConfig) => {
  const appFolder = appdataPath(name)
  const defaultConfigFile = path.join(appFolder, "config.default.yml")
  fss.outputYaml(defaultConfigFile, defaultConfig)
  const configFile = path.join(appFolder, "config.yml")
  if (!fs.existsSync(configFile)) {
    fss.outputFile(configFile, defaultConfig |> writeYaml, "utf8")
    return false
  }
  const config = fss.readYaml(configFile)
  const givenKeys = Object.keys(config)
  const defaultKeys = Object.keys(defaultConfig)
  const missingKeys = difference(defaultKeys, givenKeys)
  if (missingKeys.length) {
    for (const missingKey of missingKeys) {
      config[missingKey] = defaultConfig[missingKey]
    }
    fss.outputFile(configFile, config |> writeYaml, "utf8")
  }
  return config
}