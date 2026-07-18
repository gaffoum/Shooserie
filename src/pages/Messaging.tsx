import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  useMyConversations,
  useConversationMessages,
  useSendMessage,
  useMarkMessagesAsRead,
  useDeleteMessage,
  useDeleteConversation,
} from '../lib/queries'
import { useT } from '@/i18n/I18nContext'
import { SneakerPhoto } from '@/components/SneakerPhoto'
import './Messaging.css'

export function Messaging() {
  const { t } = useT()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data: conversations, isLoading } = useMyConversations()
  const activeId = params.get('c')

  return (
    <div style={pageStyle}>
      <div style={headerWithBackStyle}>
        <Link to="/dashboard" style={backLinkStyle}>← Dashboard</Link>
        <h1 style={titleStyle}>{t('messaging.title')}</h1>
      </div>

      <div className={'msg-layout' + (activeId ? ' has-active' : '')}>
        {/* Sidebar — list of conversations */}
        <aside className="msg-sidebar" style={sidebarStyle}>
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
              <div style={convAvatarWrapStyle}>
                <SneakerPhoto stockxUrl={c.sneaker_photo} alt="" />
              </div>
              <div style={convInfoStyle}>
                <div style={convNameStyle}>{c.other_user_name}</div>
                {c.sneaker_name && (
                  <div style={convSneakerStyle}>{c.sneaker_name}</div>
                )}
              </div>
              {(c.unread_count ?? 0) > 0 && (
                <span style={unreadBadgeStyle}>{c.unread_count}</span>
              )}
            </button>
          ))}
        </aside>

        {/* Chat view */}
        <main className="msg-chat" style={chatMainStyle}>
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
  const { t } = useT()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: messages, isLoading } = useConversationMessages(conversationId)
  const { data: conversations } = useMyConversations()
  const sendMessage = useSendMessage()
  const deleteMessage = useDeleteMessage()
  const deleteConversation = useDeleteConversation()
  const markAsRead = useMarkMessagesAsRead()
  const [content, setContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmDeleteConv, setConfirmDeleteConv] = useState(false)

  // Get current conversation info for header
  const currentConv = conversations?.find((c) => c.id === conversationId)

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
      setConfirmDelete(messageId)
      setTimeout(() => {
        setConfirmDelete((curr) => (curr === messageId ? null : curr))
      }, 3000)
      return
    }
    deleteMessage.mutate({ messageId, conversationId })
    setConfirmDelete(null)
  }

  const handleDeleteConv = () => {
    if (!confirmDeleteConv) {
      setConfirmDeleteConv(true)
      setTimeout(() => setConfirmDeleteConv(false), 3000)
      return
    }
    deleteConversation.mutate(conversationId, {
      onSuccess: () => {
        navigate('/messages')
      },
    })
    setConfirmDeleteConv(false)
  }

  return (
    <>
      {/* Chat header with delete conversation button */}
      <div style={chatHeaderStyle}>
        <button
          type="button"
          className="msg-back"
          aria-label={t('messaging.backToList')}
          onClick={() => navigate('/messages')}
        >
          ←
        </button>
        <div style={chatHeaderInfoStyle}>
          {currentConv && (
            <>
              <div style={chatHeaderNameStyle}>
                {currentConv.other_user_name}
              </div>
              {currentConv.sneaker_name && (
                <div style={chatHeaderSneakerStyle}>
                  {currentConv.sneaker_name}
                </div>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={handleDeleteConv}
          style={confirmDeleteConv ? deleteConvBtnConfirmStyle : deleteConvBtnStyle}
          disabled={deleteConversation.isPending}
          title="Supprimer cette conversation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
          {confirmDeleteConv ? 'Confirmer ?' : 'Supprimer'}
        </button>
      </div>

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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2.5"
                         strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
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
          placeholder={t('messaging.typeMessage')}
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
const headerWithBackStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  marginBottom: 24,
}

const backLinkStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 500,
  padding: '8px 14px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
}

const pageStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px 16px',
}

const titleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  margin: 0,
  fontFamily: "'Outfit', sans-serif",
}

const sidebarStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
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
  background: 'var(--color-surface)',
  border: '1px solid transparent',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  fontFamily: 'inherit',
}

const convItemActiveStyle: React.CSSProperties = {
  ...convItemStyle,
  borderColor: 'var(--color-bred)',
  background: 'var(--color-bred-bg)', /* lisible en clair ET sombre */
}

const convAvatarWrapStyle: React.CSSProperties = {
  position: 'relative',
  width: 40,
  height: 40,
  borderRadius: 8,
  overflow: 'hidden',
  background: 'var(--color-bg)',
  flexShrink: 0,
}

const convInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const convNameStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const convSneakerStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--color-bred)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const unreadBadgeStyle: React.CSSProperties = {
  background: 'var(--color-bred)',
  color: 'white',
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 6px',
  borderRadius: 10,
  minWidth: 18,
  textAlign: 'center',
}

const chatMainStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
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
  color: 'var(--color-text-faint)',
  fontSize: 14,
}

// === Chat header (avec bouton supprimer conversation) ===
const chatHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface-alt)',
}

const chatHeaderInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const chatHeaderNameStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--color-text)',
}

const chatHeaderSneakerStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--color-bred)',
}

const deleteConvBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  background: 'transparent',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  color: 'var(--color-text-muted)',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const deleteConvBtnConfirmStyle: React.CSSProperties = {
  ...deleteConvBtnStyle,
  background: 'var(--color-bred)',
  color: 'white',
  borderColor: 'var(--color-bred)',
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
  background: 'var(--color-bred)',
  color: 'white',
  padding: '10px 14px',
  borderRadius: 18,
  borderBottomRightRadius: 4,
  fontSize: 14,
  wordBreak: 'break-word',
}

const bubbleOtherStyle: React.CSSProperties = {
  maxWidth: '70%',
  background: 'var(--color-surface-alt)',
  color: 'var(--color-text)',
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
  color: 'var(--color-text-faint)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.4,
  transition: 'opacity 0.15s, color 0.15s, background 0.15s',
  flexShrink: 0,
}

const deleteBtnConfirmStyle: React.CSSProperties = {
  ...deleteBtnStyle,
  background: 'var(--color-bred)',
  color: 'white',
  opacity: 1,
}

const chatInputBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: 12,
  borderTop: '1px solid var(--color-border)',
}

const chatInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 14px',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  background: 'var(--color-bg)', /* sinon fond/texte par défaut illisibles en sombre */
  color: 'var(--color-text)',
  outline: 'none',
}

const sendButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: 'var(--color-bred)',
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
  color: 'var(--color-text-faint)',
  fontSize: 13,
}
