import type { ParsedMessage } from '../utils/webhookParser'

/**
 * Webhook da Datafy (formato Meta). Recebe mensagens/echoes/status,
 * faz upsert da conversa e grava as mensagens no Supabase (idempotente).
 *
 * Datafy não envia header de assinatura por ora (endpoint aberto).
 * TODO: publicar no Pusher após gravar (camada de realtime).
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'payload do webhook inválido' })
  }

  const supabase = useSupabaseServer()
  const events = parseWebhook(body)
  let failed = 0

  for (const ev of events) {
    try {
      if (ev.type === 'status') {
        const { data: current, error: readError } = await supabase
          .from('messages')
          .select('status')
          .eq('wa_message_id', ev.waMessageId)
          .maybeSingle()

        if (readError) throw readError
        if (!current) {
          console.warn('[webhook] status sem mensagem correspondente:', ev.waMessageId)
          continue
        }

        if (statusRank(ev.status) > statusRank(current.status)) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({ status: ev.status })
            .eq('wa_message_id', ev.waMessageId)
          if (updateError) throw updateError

          await publishStatus(ev.waMessageId, ev.status)
        }
        continue
      }

      await persistMessage(supabase, ev)
    } catch (e) {
      failed++
      console.error('[webhook] erro ao processar evento:', e)
    }
  }

  if (failed > 0) {
    throw createError({
      statusCode: 500,
      statusMessage: `falha ao processar ${failed} de ${events.length} eventos`,
    })
  }

  return { ok: true, processed: events.length }
})

function statusRank(status: string | null): number {
  return { sent: 1, delivered: 2, read: 3, failed: 4 }[status ?? ''] ?? 0
}

async function persistMessage(supabase: ReturnType<typeof useSupabaseServer>, ev: ParsedMessage) {
  if (!ev.phoneNumberId || !ev.contactWaId) return

  // 1) upsert da conversa (por número + contato)
  const conversationId = await upsertConversation(supabase, ev)
  if (!conversationId) return

  // 2) resolve mídia (stub por ora -> media_url nulo)
  const mediaUrl = ev.mediaId ? await resolveMediaUrl(ev.mediaId) : null

  // 3) grava a mensagem (idempotente por wa_message_id)
  const { data: inserted, error } = await supabase
    .from('messages')
    .upsert(
      {
        conversation_id: conversationId,
        wa_message_id: ev.waMessageId,
        direction: ev.direction,
        kind: ev.kind,
        from_wa_id: ev.fromWaId,
        to_wa_id: ev.toWaId ?? null,
        body: ev.body ?? null,
        caption: ev.caption ?? null,
        media_id: ev.mediaId ?? null,
        media_url: mediaUrl,
        status: ev.direction === 'out' ? 'sent' : null,
        wa_timestamp: ev.waTimestamp,
      },
      { onConflict: 'wa_message_id', ignoreDuplicates: true },
    )
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[webhook] insert message:', error.message)
    return
  }
  // duplicado (já processado) -> não republica
  if (!inserted) return

  // 4) atualiza a prévia/posição da conversa
  const { data: convRow } = await supabase
    .from('conversations')
    .update({
      last_message_preview: previewFor(ev.kind, ev.body, ev.caption),
      last_message_at: ev.waTimestamp,
    })
    .eq('id', conversationId)
    .select('*')
    .single()

  // 5) publica no Pusher pro front atualizar ao vivo
  if (convRow) await publishNewMessage(convRow, inserted)
}

/** Garante a conversa (insert/update) e retorna o id. */
async function upsertConversation(
  supabase: ReturnType<typeof useSupabaseServer>,
  ev: ParsedMessage,
): Promise<string | null> {
  const row: Record<string, unknown> = {
    phone_number_id: ev.phoneNumberId,
    wa_id: ev.contactWaId,
    display_phone_number: ev.displayPhoneNumber ?? null,
    waba_id: ev.wabaId ?? null,
  }
  // só sobrescreve nome/userId quando vierem no payload (echo não traz nome)
  if (ev.contactName) row.contact_name = ev.contactName
  if (ev.contactUserId) row.contact_user_id = ev.contactUserId

  const { data, error } = await supabase
    .from('conversations')
    .upsert(row, { onConflict: 'phone_number_id,wa_id' })
    .select('id')
    .single()

  if (error) {
    console.error('[webhook] upsert conversation:', error.message)
    return null
  }
  return data?.id ?? null
}
