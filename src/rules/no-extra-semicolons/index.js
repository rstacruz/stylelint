import {
  hasEmptyBlock,
  isCustomPropertySet,
  report,
  ruleMessages,
  validateOptions,
} from "../../utils"
import styleSearch from "style-search"

export const ruleName = "no-extra-semicolons"

export const messages = ruleMessages(ruleName, {
  rejected: "Unexpected extra semicolon",
})

function getOffsetByNode(node) {
  const string = node.root().toString()
  const nodeColumn = node.source.start.column
  const nodeLine = node.source.start.line
  let line = 1
  let column = 1
  let index = 0

  for (let i = 0; i < string.length; i++) {
    if (column === nodeColumn && nodeLine === line) {
      index = i
      break
    }

    if (string[i] === "\n") {
      column = 1
      line += 1
    } else {
      column += 1
    }
  }

  return index
}

export default function (actual) {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, { actual })
    if (!validOptions) { return }

    if (root.raws.after) {
      const rawAfterRoot = root.raws.after
      styleSearch({ source: rawAfterRoot, target: ";" }, match => {
        complain(root.toString().length - rawAfterRoot.length + match.startIndex)
      })
    }

    root.walk((node) => {
      if (node.raws.before) {
        const rawBeforeNode = node.raws.before
        let allowedSemi = 0

        if (node.type === "rule" && isCustomPropertySet(node.selector)) {
          allowedSemi = 1
        }

        let countSemi = 0

        styleSearch({ source: rawBeforeNode, target: ";" }, match => {
          countSemi++

          if (countSemi === allowedSemi) { return }

          complain(getOffsetByNode(node) - rawBeforeNode.length + match.startIndex)
        })
      }

      if (node.raws.after) {
        const rawAfterNode = node.raws.after
        let allowedSemi = 0

        if (!hasEmptyBlock(node)
          && node.nodes[node.nodes.length - 1].selector
          && isCustomPropertySet(node.nodes[node.nodes.length - 1].selector)
        ) { allowedSemi = 1 }

        let countSemi = 0

        styleSearch({ source: rawAfterNode, target: ";" }, match => {
          countSemi++

          if (countSemi === allowedSemi) { return }

          const index = getOffsetByNode(node)
            + node.toString().length - 1
            - rawAfterNode.length
            + match.startIndex
          complain(index)
        })
      }
    })

    function complain(index) {
      report({
        message: messages.rejected,
        node: root,
        index,
        result,
        ruleName,
      })
    }
  }
}
