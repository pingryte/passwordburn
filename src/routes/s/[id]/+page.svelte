<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { supabase } from '$lib/supabase'
  import { decrypt } from '$lib/crypto'

  let loading = true
  let error: string | null = null
  let decryptedSecret: string | null = null

  onMount(async () => {
    const id = $page.params.id
    const keyB64 = window.location.hash?.slice(1)

    if (!keyB64) {
      error = 'Missing decryption key in URL.'
      loading = false
      return
    }

    const { data, error: fetchError } = await supabase
      .from('secrets')
      .select('ciphertext, iv')
      .eq('id', id)
      .single()

    if (fetchError || !data) {
      error = 'Secret not found or already viewed.'
      loading = false
      return
    }

    try {
      decryptedSecret = await decrypt(data.ciphertext, data.iv, keyB64)

      // Mark as viewed
      await supabase
        .from('secrets')
        .delete()
        .eq('id', id)
    } catch (e) {
      error = 'Failed to decrypt secret.'
    }

    loading = false
  })
</script>

<main class="max-w-xl mx-auto mt-16 px-4 text-center">
  {#if loading}
    <p class="text-gray-500">🔄 Loading secret...</p>
  {:else if error}
    <p class="text-red-600 font-semibold">❌ {error}</p>
  {:else if decryptedSecret}
    <div class="bg-gray-100 border p-4 rounded-md text-left mt-4">
      <p class="font-mono whitespace-pre-wrap">{decryptedSecret}</p>
    </div>
    <button
      class="mt-4 bg-zinc-800 text-white px-4 py-2 rounded hover:bg-zinc-700"
      on:click={() => decryptedSecret && navigator.clipboard.writeText(decryptedSecret)}
    >
      📋 Copy to Clipboard
    </button>
    <a href="/" class="mt-6 block text-blue-600 hover:underline">
      ← Create a new secret
    </a>
    <p class="mt-4 text-sm text-gray-500">⚠️ This secret is no longer available after this view.</p>
  {/if}
</main>