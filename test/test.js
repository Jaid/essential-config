import path from "path"
import fs from "fs"

import appdataPath from "appdata-path"

const indexModule = (process.env.MAIN ? path.resolve(process.env.MAIN) : path.join(__dirname, "..", "src")) |> require
const {default: essentialConfig} = indexModule

it("should run", () => {
  const id = `${_PKG_NAME}-test`
  essentialConfig(id, {
    car: {
      color: "red",
      speed: 522,
    },
  })
  for (const fileName of ["config.yml", "config.default.yml"]) {
    const configFile = path.join(appdataPath(id), fileName)
    expect(fs.existsSync(configFile)).toBeTruthy()
    const content = fs.readFileSync(configFile, "utf8")
    expect(content.length).toBeGreaterThan(10)
  }
})