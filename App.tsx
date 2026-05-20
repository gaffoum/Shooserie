import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import { useT } from '@/i18n/I18nContext'

interface TagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  /** Suggestions affichées en dessous quand l'input a le focus */
  suggestions?: string[]
}

/**
 * Chip-based tags input. Type a tag, press Enter or comma to add. Backspace
 * on an empty input removes the last tag. Click the × on a chip to remove it.
 */
export function TagsInput({
  value,
  onChange,
  placeholder,
  suggestions = [],
}: TagsInputProps) {
  const { t } = useT()
  const ph = placeholder ?? t('form.tagsPlaceholder')
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)

  const add = (raw: string) => {
    const tag = raw.trim().toLowerCase()
    if (!tag) return
    if (value.includes(tag)) return
    onChange([...value, tag])
    setDraft('')
  }

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      remove(value[value.length - 1])
    }
  }

  const filteredSuggestions = suggestions
    .filter((s) => !value.includes(s))
    .filter((s) => s.includes(draft.trim().toLowerCase()))
    .slice(0, 6)

  return (
    <div>
      <div style={chipsBoxStyle}>
        {value.map((tag) => (
          <span key={tag} style={chipStyle}>
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              style={chipRemoveStyle}
              aria-label={t('form.tagRemoveAria', { tag })}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => {
            if (draft.trim()) add(draft)
            window.setTimeout(() => setFocused(false), 150)
          }}
          onFocus={() => setFocused(true)}
          placeholder={value.length === 0 ? ph : ''}
          style={inputStyle}
        />
      </div>
      {focused && filteredSuggestions.length > 0 && (
        <div style={suggestionsStyle}>
          {filteredSuggestions.map((s) => (
            <button
              type="button"
              key={s}
              onMouseDown={(e) => {
                e.preventDefault()
                add(s)
              }}
              style={suggestionItemStyle}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* =====================================================
 * Styles
 * ===================================================== */

const chipsBoxStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  alignItems: 'center',
  padding: '8px 10px',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  minHeight: 42,
}
const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 4px 4px 10px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 999,
  fontSize: 12,
  color: 'var(--color-text)',
  fontWeight: 500,
}
const chipRemoveStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 18,
  height: 18,
  borderRadius: '50%',
  background: 'transparent',
  color: 'var(--color-text-muted)',
  fontSize: 16,
  lineHeight: 1,
  cursor: 'pointer',
  padding: 0,
}
const inputStyle: CSSProperties = {
  flex: '1 1 120px',
  minWidth: 80,
  border: 'none',
  outline: 'none',
  fontSize: 13,
  background: 'transparent',
  color: 'var(--color-text)',
  fontFamily: 'inherit',
  padding: '4px 0',
}
const suggestionsStyle: CSSProperties = {
  marginTop: 4,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
}
const suggestionItemStyle: CSSProperties = {
  padding: '4px 10px',
  fontSize: 11,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 999,
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
}
