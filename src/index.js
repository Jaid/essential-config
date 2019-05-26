import path from "path"
import fs from "fs"

import fss from "@absolunet/fss"
import appdataPath from "appdata-path"

export default (name, defaultConfig) => {
  const appFolder = appdataPath(name)
  const defaultConfigFile = path.join(appFolder, "config.default.yml")
  fss.outputYaml(defaultConfigFile, defaultConfig)
  const configFile = path.join(appFolder, "config.yml")
  if (!fs.existsSync(configFile)) {
    fss.outputYaml(configFile, defaultConfig)
    return false
  }
  return fss.readYaml(configFile)
}