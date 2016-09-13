/**
 * Check whether a property is a custom properties
 *
 * @param {string} customPropertySet
 * @return {boolean} If `true`, property is a custom properties
 */
export default function (customPropertySet) {
  return (customPropertySet.slice(0, 2) === "--" && customPropertySet.slice(-1) === ":")
}
