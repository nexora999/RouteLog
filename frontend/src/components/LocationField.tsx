import { useEffect, useRef, useState, type ReactNode } from 'react'
import { suggestLocations } from '../api'

interface Suggestion {
  label: string
  display_name: string
}

interface Props {
  id: string
  label: string
  placeholder: string
  value: string
  icon?: ReactNode
  onChange: (value: string) => void
}

export default function LocationField({ id, label, placeholder, value, icon, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Suggestion[]>([])
  const [active, setActive] = useState(0)
  const [focusNonce, setFocusNonce] = useState(0)
  const focused = useRef(false)
  const requestSeq = useRef(0)

  useEffect(() => {
    if (!focused.current) return

    const query = value.trim()
    if (query.length < 3) {
      setItems([])
      setOpen(false)
      return
    }

    const seq = ++requestSeq.current
    const handle = window.setTimeout(() => {
      suggestLocations(query)
        .then((results) => {
          if (!focused.current || seq !== requestSeq.current) return
          const next = results.slice(0, 6)
          setItems(next)
          setOpen(next.length > 0)
          setActive(0)
        })
        .catch(() => {
          if (seq !== requestSeq.current) return
          setItems([])
          setOpen(false)
        })
    }, 280)

    return () => window.clearTimeout(handle)
  }, [value, focusNonce])

  function close() {
    focused.current = false
    requestSeq.current += 1
    setOpen(false)
    setItems([])
  }

  function choose(item: Suggestion) {
    onChange(item.label)
    close()
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-control">
        {icon}
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-suggestions`}
          aria-autocomplete="list"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => {
            focused.current = true
            setFocusNonce((n) => n + 1)
          }}
          onBlur={() => {
            window.setTimeout(close, 120)
          }}
          onKeyDown={(event) => {
            if (!open || items.length === 0) return
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActive((i) => Math.min(i + 1, items.length - 1))
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive((i) => Math.max(i - 1, 0))
            }
            if (event.key === 'Enter') {
              event.preventDefault()
              choose(items[active])
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              close()
            }
          }}
        />
      </div>
      {open && items.length > 0 ? (
        <div id={`${id}-suggestions`} className="suggest" role="listbox">
          {items.map((item, index) => (
            <button
              type="button"
              key={`${item.label}-${index}`}
              className={index === active ? 'active' : ''}
              onMouseDown={(event) => {
                event.preventDefault()
                choose(item)
              }}
            >
              {item.label}
              <small>{item.display_name}</small>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
