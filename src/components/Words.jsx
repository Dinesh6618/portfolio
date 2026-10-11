import { cloneElement, Fragment, isValidElement, useRef } from 'react'
import useDecode from '../hooks/useDecode.js'

// Splits strings into word hosts; elements (e.g. <em>) are kept and their children are split too.
function splitWords(node, counter) {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
      .split(/(\s+)/)
      .map((part) => {
        if (part === '') return null
        if (/^\s+$/.test(part)) return part
        counter.n += 1
        return (
          <span className="w" data-decode key={counter.n}>
            <span className="w-t" data-decode-text>
              {part}
            </span>
            <span className="w-x" aria-hidden="true">
              <span data-decode-r />
              <span className="w-xs" data-decode-s />
            </span>
          </span>
        )
      })
  }
  if (Array.isArray(node)) {
    return node.map((child, i) => <Fragment key={i}>{splitWords(child, counter)}</Fragment>)
  }
  if (isValidElement(node) && node.props.children != null) {
    return cloneElement(node, undefined, splitWords(node.props.children, counter))
  }
  return node
}

// Text whose words decode into place when it scrolls into view.
// The real text stays in the DOM the whole time, so screen readers, search and copy/paste are unaffected.
export default function Words({ as: Tag = 'span', children, delay = 0, step, duration = 520, className = '' }) {
  const ref = useRef(null)
  useDecode(ref, { delay, step, duration })
  return (
    <Tag ref={ref} className={className ? `words ${className}` : 'words'}>
      {splitWords(children, { n: 0 })}
    </Tag>
  )
}
