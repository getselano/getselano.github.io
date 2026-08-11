import React, { useEffect, useRef, useState } from 'react'
import { t } from '../../theme/tokens'
import { useAuth } from '../../auth/AuthContext'
import {
  listMessagesForMember, markMessageRead, subscribeToMemberMessages,
  MESSAGE_CATEGORIES,
} from '../../services/adminMessages'

// Bell icon + dropdown panel in the TopBar. Members only.
// Loads recent admin messages, shows unread count, and opens a panel
// listing them with per-message "mark read" behavior.

const cat = (key) => MESSAGE_CATEGORIES.find(c => c.key === key) || MESSAGE_CATEGORIES[0]

export function AdminMessageBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const panelRef = useRef(null)
  const btnRef = useRef(null)

  async function load() {
    if (!user?.id) return
    const rows = await listMessagesForMember(user.id)
    setMessages(rows)
  }

  useEffect(() => {
    load()
    if (!user?.id) return
    // Realtime — when a new message lands, refresh the list (toast component
    // handles the actual popup; bell just needs to show the new count).
    const unsub = subscribeToMemberMessages(user.id, () => { load() })
    return unsub
  }, [user?.id])

  // Close panel on outside click
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target)) return
      if (btnRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [open])

  const unread = messages.filter(m => !m.read_at).length

  const markOne = async (m) => {
    if (m.read_at) return
    setMessages(prev => prev.map(x => x.id === m.id ? { ...x, read_at: new Date().toISOString() } : x))
    await markMessageRead(m.id, user.id)
  }

  const markAll = async () => {
    const unreadOnes = messages.filter(m => !m.read_at)
    if (!unreadOnes.length) return
    const now = new Date().toISOString()
    setMessages(prev => prev.map(x => ({ ...x, read_at: x.read_at || now })))
    await Promise.all(unreadOnes.map(m => markMessageRead(m.id, user.id)))
  }

  return (
    <div style={{ position:'relative' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        aria-label="התראות"
        title="התראות"
        style={{
          background:'transparent',
          border:`1px solid ${t.color.border}`,
          borderRadius: t.radius.pill,
          padding:'6px 10px',
          color: t.color.text, cursor:'pointer',
          display:'flex', alignItems:'center', gap: 4,
          position:'relative',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position:'absolute', top:-3, insetInlineEnd:-3,
            minWidth: 16, height: 16, padding:'0 4px',
            background: t.color.wineLight || '#c74050', color:'#fff',
            borderRadius: 999, fontSize: 10, fontWeight: 700,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:`0 0 0 2px ${t.color.bgElevated}`,
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div ref={panelRef} style={{
          position:'absolute', top: 'calc(100% + 8px)', insetInlineEnd: 0,
          width: 340, maxHeight: '70vh',
          background: t.color.bgElevated,
          border: `1px solid ${t.color.border}`,
          borderRadius: t.radius.md,
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          zIndex: 500, display:'flex', flexDirection:'column',
        }}>
          <div style={{
            padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between',
            borderBottom: `1px solid ${t.color.hairline}`,
          }}>
            <div style={{ fontWeight: 700, color: t.color.text, fontSize: 14 }}>
              התראות {unread > 0 ? `(${unread} חדשות)` : ''}
            </div>
            {unread > 0 && (
              <button onClick={markAll} style={{
                background:'transparent', border:'none', color: t.color.textDim,
                cursor:'pointer', fontFamily:'inherit', fontSize: 11, padding: 4,
                textDecoration:'underline',
              }}>סמן הכל כנקרא</button>
            )}
          </div>

          <div style={{ overflowY:'auto', flex: 1 }}>
            {messages.length === 0 ? (
              <div style={{ padding: 40, textAlign:'center', color: t.color.textDim, fontSize: 13 }}>
                אין התראות עדיין
              </div>
            ) : messages.map(m => {
              const c = cat(m.category)
              const unreadRow = !m.read_at
              return (
                <button
                  key={m.id}
                  onClick={() => markOne(m)}
                  style={{
                    display:'block', width:'100%', textAlign:'right',
                    padding:'12px 14px',
                    background: unreadRow ? `${c.color}0f` : 'transparent',
                    border:'none', borderBottom:`1px solid ${t.color.hairline}`,
                    cursor: unreadRow ? 'pointer':'default',
                    color: 'inherit', fontFamily:'inherit',
                    direction:'rtl',
                  }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing:'0.1em',
                      textTransform:'uppercase', color: c.color,
                      padding:'2px 8px', borderRadius: 999,
                      background: `${c.color}18`, border: `1px solid ${c.color}44`,
                    }}>{c.label}</span>
                    {unreadRow && <span style={{
                      width: 6, height: 6, borderRadius:'50%', background: c.color,
                      marginInlineStart:'auto',
                    }}/>}
                  </div>
                  {m.title && (
                    <div style={{ fontWeight: 700, color: t.color.text, fontSize: 13, marginBottom: 2 }}>
                      {m.title}
                    </div>
                  )}
                  <div style={{ color: t.color.silver1, fontSize: 12, lineHeight: 1.5, whiteSpace:'pre-wrap' }}>
                    {m.body}
                  </div>
                  <div style={{
                    marginTop: 6, fontSize: 10, color: t.color.textMuted,
                    fontFamily: t.font.family.mono, letterSpacing:'0.06em',
                  }}>
                    {new Date(m.created_at).toLocaleString('he-IL', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                    {m.sender_name && ` · ${m.sender_name}`}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
