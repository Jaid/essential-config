import path from "path"
import fs from "fs"

import fss from "@absolunet/fss"
import appdataPath from "appdata-path"
import {difference} from "lodash"
import sortKeys from "sort-keys"

export default (name, defaultConfig) => {
  const appFolder = appdataPath(name)
  const defaultConfigFile = path.join(appFolder, "config.default.yml")
  fss.outputYaml(defaultConfigFile, defaultConfig)
  const configFile = path.join(appFolder, "config.yml")
  if (!fs.existsSync(configFile)) {
    fss.outputYaml(configFile, defaultConfig |> sortKeys)
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
    fss.outputYaml(configFile, config |> sortKeys)
  }
  return config
}