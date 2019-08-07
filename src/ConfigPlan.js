/**
 * @typedef {Object} Options
 * @prop {Object<string, FieldDescription>} fields
 * @prop {Object<string, *>} defaults
 * @prop {string[]} secretKeys
 */

/**
 * @typedef {Object<string, *>} FieldDescription
 * @prop {*} defaultValue
 * @prop {boolean} secret
 */

export default class {

  /**
   * @constructor
   * @param {Options} options
   */
  constructor(options) {
    const {fields = {}, defaults = {}, secretKeys = []} = options
    /**
     * @type {Object<string, FieldDescription>}
     */
    this.fields = {}
    Object.assign(this.fields, fields)
    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (this.fields.hasOwnProperty(key)) {
        this.fields[key].defaultValue = defaultValue
      } else {
        this.fields[key] = {defaultValue}
      }
    }
    for (const key of secretKeys) {
      if (this.fields.hasOwnProperty(key)) {
        this.fields[key].secret = true
      } else {
        this.fields[key] = {secret: true}
      }
    }
    for (const field of Object.values(this.fields)) {
      if (field.secret === undefined) {
        field.secret = false
      }
    }
  }

  /**
   * @return {string[]}
   */
  getKeys() {
    return Object.keys(this.fields)
  }

  /**
   * @param {(field: FieldDescription, key: string) => boolean} filterFunction
   * @return {string[]}
   */
  getKeysBy(filterFunction) {
    return Object.entries(this.fields).filter(([key, field]) => filterFunction(field, key)).map(([key]) => key)
  }

  /**
   * @return {string[]}
   */
  getSecretKeys() {
    return this.getKeysBy(field => field.secret === true)
  }

  /**
   * @return {string[]}
   */
  getNonSecretKeys() {
    return this.getKeysBy(field => field.secret === false)
  }

}