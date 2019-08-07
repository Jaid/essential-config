import jsYaml from "js-yaml"

export default config => jsYaml.safeDump(config, {
  lineWidth: -1,
  noArrayIndent: true,
  noCompatMode: true,
  noRefs: true,
})