<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { getSupabase } from '$lib/supabase'
  import { decrypt } from '$lib/crypto'

  let loading = true
  let error: string | null = null
  let decryptedSecret: string | null = null
  let data: any
  let viewed = false
  let keyB64 = ''
  let id: string = ''
  let hasViewed = false
  let supabase: ReturnType<typeof getSupabase>

  const viewSecret = async () => {
    if (!data || viewed) return
    hasViewed = true
    try {
      decryptedSecret = await decrypt(data.ciphertext as string, data.iv as string, keyB64)
      viewed = true

      if (!data.expires_at) {
        await supabase
          .from('secrets')
          .delete()
          .eq('id', id)
      }
    } catch (e) {
      if (e instanceof Error) {
        error = `Failed to decrypt secret: ${e.message}`
      } else {
        error = 'Failed to decrypt secret.'
      }
    }
  }

  onMount(async () => {
    supabase = getSupabase()
    id = $page.params.id ?? ''
    if (!id) {
      error = 'Invalid or missing secret ID.'
      loading = false
      return
    }

    keyB64 = window.location.hash?.slice(1) || ''
    if (!keyB64) {
      error = 'Missing decryption key in URL.'
      loading = false
      return
    }

    const { data: fetchedData, error: fetchError } = await supabase
      .from('secrets')
      .select('ciphertext, iv, expires_at')
      .eq('id', id)
      .single()

    if (fetchError || !fetchedData || !fetchedData.ciphertext) {
      error = 'Secret not found or already viewed.'
      loading = false
      return
    }

    if (typeof fetchedData.expires_at === 'string' && new Date(fetchedData.expires_at) < new Date()) {
      error = 'This secret has expired.'
      loading = false
      return
    }

    data = fetchedData
    loading = false
  })
</script>

<main class="max-w-xl mx-auto mt-16 px-4 text-center">
  {#if loading}
    <p class="text-gray-500">🔄 Loading secret...</p>
  {:else if error}
    <p class="text-red-600 font-semibold">❌ {error}</p>
  {:else if data}
    {#if !viewed}
      <button
        class="mt-4 bg-zinc-800 text-white px-4 py-2 rounded hover:bg-zinc-700"
        on:click={viewSecret}
      >
        🔓 View Secret
      </button>
    {:else}
      <div class="bg-gray-100 border p-4 rounded-md text-left mt-4">
        <p class="font-mono whitespace-pre-wrap">{decryptedSecret}</p>
      </div>
      <p class="mt-2 text-sm text-gray-500">
        ⏳ This secret was set to expire after {data.expires_in_minutes} minute(s).
      </p>
      <button
        class="mt-4 bg-zinc-800 text-white px-4 py-2 rounded hover:bg-zinc-700"
        on:click={() => {
          const url = window.location.href;
          navigator.clipboard.writeText(url)
            .then(() => console.log('Copied URL to clipboard'))
            .catch((err) => console.error('Copy failed', err));
        }}
      >
        📋 Copy to Clipboard
      </button>
      <a href="/" class="mt-6 block text-blue-600 hover:underline">
        ← Create a new secret
      </a>
      <p class="mt-4 text-sm text-gray-500">⚠️ This secret is no longer available after this view.</p>
    {/if}
  {/if}
</main>