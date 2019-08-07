import path from "path"
import fs from "fs"

import appFolder from "app-folder"

const indexModule = (process.env.MAIN ? path.resolve(process.env.MAIN) : path.join(__dirname, "..", "src")) |> require

/**
 * @type { import("../src") }
 */
const {default: essentialConfig, createConfigPlan} = indexModule

it("createConfigPlan", () => {
  const result = createConfigPlan({
    fields: {
      color: {
        defaultValue: "red",
      },
      password: {
        secret: true,
      },
    },
  })
  expect(result.fields.password.secret).toBe(true)
  expect(result.fields.color.secret).toBe(false)
})

it("should run", () => {
  const id = `${_PKG_NAME}-test`
  const result = essentialConfig(["Jaid", id], {
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
    secretKeys: ["password", "key"],
  })
  const configFile = path.join(appFolder(id), "config.yml")
  expect(fs.existsSync(configFile)).toBeTruthy()
  const content = fs.readFileSync(configFile, "utf8")
  expect(content.length).toBeGreaterThan(10)
  expect(result.config.sonic.speed).toBe(9001)
  expect(result.configPlan.fields.sonic.defaultValue.speed).toBe(9001)
})