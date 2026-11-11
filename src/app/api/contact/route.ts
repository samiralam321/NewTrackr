import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CREATOR_EMAIL = 'sa8103339@gmail.com'
const CREATOR_USER_ID = '149304fc-ee0a-4980-83ed-9ed88cf48d6d' // Samir Alam

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, message, subject } = body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty.' },
        { status: 400 }
      )
    }

    const senderName = name?.trim() || 'Trackr User'
    const senderEmail = email?.trim() || 'noreply@trackr.app'
    const messageContent = message.trim()
    
    // Dynamic subject line prevents Gmail from threading/collapsing messages under [...]
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const preview = messageContent.length > 40 ? `${messageContent.slice(0, 40)}...` : messageContent
    const emailSubject = subject || `[Trackr Message] ${senderName}: "${preview}" (${timeStr})`

    // 1. Forward directly to Creator's email via FormSubmit server-side
    // Running server-side bypasses browser ad-blockers and CORS restrictions
    try {
      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(CREATOR_EMAIL)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Origin': 'https://trackr-connect.vercel.app',
          'Referer': 'https://trackr-connect.vercel.app/dashboard',
        },
        body: JSON.stringify({
          "Sender Name": senderName,
          "Sender Email": senderEmail,
          "Message Content": messageContent,
          "Timestamp": new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
          "_subject": emailSubject,
          "_replyto": senderEmail,
          "_captcha": "false",
        }),
      })
    } catch (emailErr) {
      console.error('Server-side email dispatch failed:', emailErr)
    }

    // 2. Also record in Supabase messages for Creator if authenticated
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: CREATOR_USER_ID,
          content: `📬 [Contact Admin / Creator Submission]\n\nFrom: ${senderName} (${senderEmail})\n\nMessage:\n${messageContent}`
        })
      }
    } catch (dbErr) {
      console.warn('Could not mirror contact message into in-app messages:', dbErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully to the creator!'
    })
  } catch (error: any) {
    console.error('Error handling contact submission:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
