import path from "path"
import fs from "fs"

import appFolder from "app-folder"

const indexModule = (process.env.MAIN ? path.resolve(process.env.MAIN) : path.join(__dirname, "..", "src")) |> require
const {default: essentialConfig} = indexModule

it("should run", () => {
  const id = `${_PKG_NAME}-test`
  essentialConfig(id, {
    defaults: {
      car: {
        color: "red",
        speed: 522,
      },
      sonic: {
        color: "blue",
        speed: 9001,
      },
      hello: "world",
      password: "INSERT",
    },
    sensitiveKeys: ["password"],
  })
  const configFile = path.join(appFolder(id), "config.yml")
  expect(fs.existsSync(configFile)).toBeTruthy()
  const content = fs.readFileSync(configFile, "utf8")
  expect(content.length).toBeGreaterThan(10)
})