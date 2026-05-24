import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useT } from '@/i18n/I18nContext'
import { useAuth } from '@/contexts/AuthContext'
import { AppHeader } from '@/components/AppHeader'
import { BackLink } from '@/components/BackLink'
import {
  useMyConversations,
  useConversationMessages,
  useSendMessage,
  useMarkMessagesAsRead,
  type Conversation,
} from '@/lib/queries'

/**
 * Messaging page — two-pane layout (conversations list + active chat).
 * On mobile, only one pane is shown at a time.
 * The URL ?c=<conversationId> selects the active conversation.
 */
export function Messaging() {
  const { t } = useT()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeId = searchParams.get('c')
  const { data: conversations, isLoading } = useMyConversations()
  const markRead = useMarkMessagesAsRead()

  // Auto-mark active conversation as read
  useEffect(() => {
    if (activeId) {
      markRead.mutate(activeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  const activeConvo = conversations?.find((c) => c.id === activeId)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AppHeader leftActions={<BackLink to="/dashboard" />} />
      <main style={mainStyle}>
        <h1 style={titleStyle}>{t('messaging.title')}</h1>

        <div style={layoutStyle}>
          {/* Sidebar — conversations list */}
          <aside style={sidebarStyle(!activeId)}>
            {isLoading && <p style={mutedStyle}>{t('common.loading')}</p>}
            {!isLoading && (!conversations || conversations.length === 0) && (
              <p style={mutedStyle}>{t('messaging.noConversations')}</p>
            )}
            {conversations?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSearchParams({ c: c.id })}
                style={convoItemStyle(c.id === activeId)}
              >
                {c.sneaker_photo && (
                  <img
                    src={c.sneaker_photo}
                    alt=""
                    style={convoPhotoStyle}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={convoNameStyle}>
                    {c.other_user_name ?? t('messaging.unknownUser')}
                  </div>
                  {c.sneaker_name && (
                    <div style={convoSneakerStyle}>{c.sneaker_name}</div>
                  )}
                  {c.last_message_preview && (
                    <div style={convoPreviewStyle}>{c.last_message_preview}</div>
                  )}
                </div>
                {(c.unread_count ?? 0) > 0 && (
                  <span style={badgeStyle}>{c.unread_count}</span>
                )}
              </button>
            ))}
          </aside>

          {/* Chat pane */}
          <section style={chatPaneStyle(!!activeId)}>
            {activeConvo ? (
              <ChatView conversation={activeConvo} />
            ) : (
              <div style={emptyChatStyle}>
                <p style={mutedStyle}>{t('messaging.selectConversation')}</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function ChatView({ conversation }: { conversation: Conversation }) {
  const { t } = useT()
  const { user } = useAuth()
  const { data: messages, isLoading } = useConversationMessages(conversation.id)
  const sendMutation = useSendMessage()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    try {
      await sendMutation.mutateAsync({
        conversationId: conversation.id,
        content: draft.trim(),
      })
      setDraft('')
    } catch (err) {
      console.error('Send failed', err)
    }
  }

  return (
    <div style={chatContainerStyle}>
      {/* Header */}
      <div style={chatHeaderStyle}>
        {conversation.sneaker_photo && (
          <img
            src={conversation.sneaker_photo}
            alt=""
            style={chatHeaderPhotoStyle}
          />
        )}
        <div>
          <div style={chatHeaderNameStyle}>
            {conversation.other_user_name ?? t('messaging.unknownUser')}
          </div>
          {conversation.sneaker_id && conversation.sneaker_name && (
            <Link
              to={`/marketplace/${conversation.sneaker_id}`}
              style={chatHeaderSneakerStyle}
            >
              {conversation.sneaker_name}
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={messagesListStyle}>
        {isLoading && <p style={mutedStyle}>{t('common.loading')}</p>}
        {messages?.map((m) => {
          const isMine = m.sender_id === user?.id
          return (
            <div
              key={m.id}
              style={msgRowStyle(isMine)}
            >
              <div style={msgBubbleStyle(isMine)}>{m.content}</div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={inputFormStyle}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('messaging.typeMessage')}
          disabled={sendMutation.isPending}
          style={inputStyle}
        />
        <button
          type="submit"
          disabled={!draft.trim() || sendMutation.isPending}
          style={sendBtnStyle(!draft.trim() || sendMutation.isPending)}
        >
          {sendMutation.isPending ? '…' : t('messaging.send')}
        </button>
      </form>
    </div>
  )
}

/* ===== Styles ===== */

const mainStyle: CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '24px 20px 80px',
}

const titleStyle: CSSProperties = {
  fontSize: 28,
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  letterSpacing: 'var(--tracking-tight)',
  color: 'var(--color-text)',
  margin: 0,
  marginBottom: 20,
}

const layoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '300px 1fr',
  gap: 16,
  height: 'calc(100vh - 200px)',
  minHeight: 500,
}

const sidebarStyle = (isVisible: boolean): CSSProperties => ({
  display: isVisible ? 'flex' : 'flex',
  flexDirection: 'column',
  gap: 6,
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 10,
  overflowY: 'auto',
})

const convoItemStyle = (isActive: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: 10,
  background: isActive ? 'var(--color-bg)' : 'transparent',
  border: '1px solid',
  borderColor: isActive ? 'var(--color-bred)' : 'transparent',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  color: 'var(--color-text)',
  transition: 'background var(--transition-fast)',
  width: '100%',
})

const convoPhotoStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 'var(--radius-sm)',
  objectFit: 'cover',
  flexShrink: 0,
}

const convoNameStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const convoSneakerStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const convoPreviewStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-faint)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  marginTop: 2,
}

const badgeStyle: CSSProperties = {
  background: 'var(--color-bred)',
  color: '#fff',
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 7px',
  borderRadius: 999,
  minWidth: 18,
  textAlign: 'center',
}

const chatPaneStyle = (isVisible: boolean): CSSProperties => ({
  display: isVisible ? 'flex' : 'flex',
  flexDirection: 'column',
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
})

const chatContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
}

const chatHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: 14,
  borderBottom: '1px solid var(--color-border)',
}

const chatHeaderPhotoStyle: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 'var(--radius-sm)',
  objectFit: 'cover',
}

const chatHeaderNameStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text)',
}

const chatHeaderSneakerStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-bred)',
  textDecoration: 'none',
}

const messagesListStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const msgRowStyle = (isMine: boolean): CSSProperties => ({
  display: 'flex',
  justifyContent: isMine ? 'flex-end' : 'flex-start',
})

const msgBubbleStyle = (isMine: boolean): CSSProperties => ({
  maxWidth: '70%',
  padding: '8px 12px',
  background: isMine ? 'var(--color-bred)' : 'var(--color-bg)',
  color: isMine ? '#fff' : 'var(--color-text)',
  borderRadius: 'var(--radius-md)',
  fontSize: 13,
  lineHeight: 1.4,
  wordBreak: 'break-word',
})

const inputFormStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: 10,
  borderTop: '1px solid var(--color-border)',
}

const inputStyle: CSSProperties = {
  flex: 1,
  padding: '10px 13px',
  fontSize: 14,
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  fontFamily: 'inherit',
  outline: 'none',
}

const sendBtnStyle = (disabled: boolean): CSSProperties => ({
  padding: '10px 16px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  background: disabled ? 'var(--color-text-muted)' : 'var(--color-bred)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'var(--font-display)',
})

const emptyChatStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
}

const mutedStyle: CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 14,
  padding: 12,
}
