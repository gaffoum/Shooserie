import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  useMyConversations,
  useConversationMessages,
  useSendMessage,
  useMarkMessagesAsRead,
  useDeleteMessage,
} from '../lib/queries'
import { useDict } from '../i18n/I18nProvider'

export function Messaging() {
  const t = useDict()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data: conversations, isLoading } = useMyConversations()
  const activeId = params.get('c')

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>{t('messaging.title')}</h1>

      <div style={layoutStyle}>
        {/* Sidebar — list of conversations */}
        <aside style={sidebarStyle}>
          {isLoading && <p style={emptyStyle}>{t('common.loading')}</p>}

          {!isLoading && (!conversations || conversations.length === 0) && (
            <p style={emptyStyle}>{t('messaging.noConversations')}</p>
          )}

          {conversations?.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/messages?c=${c.id}`)}
              style={c.id === activeId ? convItemActiveStyle : convItemStyle}
            >
              {c.sneaker_photo ? (
                <img src={c.sneaker_photo} alt=""
                     style={convAvatarStyle} />
              ) : (
                <div style={convAvatarPlaceholderStyle}>👟</div>
              )}
              <div style={convInfoStyle}>
                <div style={convNameStyle}>{c.other_user_name}</div>
                {c.sneaker_name && (
                  <div style={convSneakerStyle}>{c.sneaker_name}</div>
                )}
              </div>
              {c.unread_count > 0 && (
                <span style={unreadBadgeStyle}>{c.unread_count}</span>
              )}
            </button>
          ))}
        </aside>

        {/* Chat view */}
        <main style={chatMainStyle}>
          {activeId ? (
            <ChatView conversationId={activeId} />
          ) : (
            <div style={chatEmptyStyle}>
              {t('messaging.selectConversation')}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// =====================================================
// ChatView
// =====================================================
function ChatView({ conversationId }: { conversationId: string }) {
  const t = useDict()
  const { user } = useAuth()
  const { data: messages, isLoading } = useConversationMessages(conversationId)
  const sendMessage = useSendMessage()
  const deleteMessage = useDeleteMessage()
  const markAsRead = useMarkMessagesAsRead()
  const [content, setContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // auto-mark as read when conversation opens
  useEffect(() => {
    if (conversationId) {
      markAsRead.mutate(conversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  // auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const handleSend = () => {
    const trimmed = content.trim()
    if (!trimmed) return
    sendMessage.mutate(
      { conversationId, content: trimmed },
      {
        onSuccess: () => setContent(''),
      },
    )
  }

  const handleDelete = (messageId: string) => {
    if (confirmDelete !== messageId) {
      // First click — show confirmation
      setConfirmDelete(messageId)
      // Auto-cancel après 3s
      setTimeout(() => {
        setConfirmDelete((curr) => (curr === messageId ? null : curr))
      }, 3000)
      return
    }
    // Second click — actually delete
    deleteMessage.mutate({ messageId, conversationId })
    setConfirmDelete(null)
  }

  return (
    <>
      <div style={chatMessagesStyle}>
        {isLoading && <p style={emptyStyle}>{t('common.loading')}</p>}

        {messages?.map((m) => {
          const isOwn = m.sender_id === user?.id
          const isConfirming = confirmDelete === m.id
          return (
            <div
              key={m.id}
              style={{
                ...bubbleRowStyle,
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
              }}
            >
              {/* Bouton supprimer — uniquement pour ses propres messages, à gauche de la bulle */}
              {isOwn && (
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  style={isConfirming ? deleteBtnConfirmStyle : deleteBtnStyle}
                  title={isConfirming
                    ? t('messaging.confirmDelete')
                    : t('messaging.deleteMessage')
                  }
                  aria-label={t('messaging.deleteMessage')}
                  disabled={deleteMessage.isPending}
                >
                  {isConfirming ? (
                    /* check icône pour confirmer */
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2.5"
                         strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    /* poubelle icône */
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  )}
                </button>
              )}

              <div style={isOwn ? bubbleOwnStyle : bubbleOtherStyle}>
                {m.content}
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      <div style={chatInputBarStyle}>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={t('messaging.placeholder')}
          style={chatInputStyle}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || sendMessage.isPending}
          style={sendButtonStyle}
        >
          {t('messaging.send')}
        </button>
      </div>
    </>
  )
}

// =====================================================
// Styles
// =====================================================
const pageStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px 16px',
}

const titleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  margin: '0 0 24px',
  fontFamily: "'Outfit', sans-serif",
}

const layoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '320px 1fr',
  gap: 16,
  height: 'calc(100vh - 200px)',
  minHeight: 500,
}

const sidebarStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: 8,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const convItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: 12,
  borderRadius: 8,
  background: 'white',
  border: '1px solid transparent',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  fontFamily: 'inherit',
}

const convItemActiveStyle: React.CSSProperties = {
  ...convItemStyle,
  borderColor: '#CE1141',
  background: '#FEF2F4',
}

const convAvatarStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 8,
  objectFit: 'cover',
  flexShrink: 0,
}

const convAvatarPlaceholderStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 8,
  background: '#F5F5F5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  flexShrink: 0,
}

const convInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const convNameStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#0A0A0A',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const convSneakerStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#CE1141',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const unreadBadgeStyle: React.CSSProperties = {
  background: '#CE1141',
  color: 'white',
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 6px',
  borderRadius: 10,
  minWidth: 18,
  textAlign: 'center',
}

const chatMainStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const chatEmptyStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9CA3AF',
  fontSize: 14,
}

const chatMessagesStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const bubbleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
}

const bubbleOwnStyle: React.CSSProperties = {
  maxWidth: '70%',
  background: '#CE1141',
  color: 'white',
  padding: '10px 14px',
  borderRadius: 18,
  borderBottomRightRadius: 4,
  fontSize: 14,
  wordBreak: 'break-word',
}

const bubbleOtherStyle: React.CSSProperties = {
  maxWidth: '70%',
  background: '#F3F4F6',
  color: '#0A0A0A',
  padding: '10px 14px',
  borderRadius: 18,
  borderBottomLeftRadius: 4,
  fontSize: 14,
  wordBreak: 'break-word',
}

const deleteBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderRadius: '50%',
  width: 28,
  height: 28,
  cursor: 'pointer',
  color: '#9CA3AF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.4,
  transition: 'opacity 0.15s, color 0.15s, background 0.15s',
  flexShrink: 0,
}

const deleteBtnConfirmStyle: React.CSSProperties = {
  ...deleteBtnStyle,
  background: '#CE1141',
  color: 'white',
  opacity: 1,
}

const chatInputBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: 12,
  borderTop: '1px solid #E5E7EB',
}

const chatInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 14px',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
}

const sendButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: '#CE1141',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 14,
  fontFamily: 'inherit',
}

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '24px 0',
  color: '#9CA3AF',
  fontSize: 13,
}
