<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { getSupabase } from '$lib/supabase'
  import { decrypt } from '$lib/crypto'
  import { theme } from '$lib/theme'

  let loading = true
  let error: string | null = null
  let decryptedSecret: string | null = null
  let data: any
  let viewed = false
  let keyB64 = ''
  let id: string = ''
  let hasViewed = false
  let supabase: ReturnType<typeof getSupabase>
  let expiryLabel = 'unknown duration'

  const toggleTheme = () => {
    theme.update(current => current === 'light' ? 'dark' : 'light');
  };

  const viewSecret = async () => {
    if (!data || viewed) return

    try {
      decryptedSecret = await decrypt(data.ciphertext as string, data.iv as string, keyB64)
      viewed = true

      if (!data.expires_at) {
        const { error: deleteError } = await supabase.from('secrets').delete().eq('id', id)
        if (deleteError) {
          console.error('❌ Failed to delete secret:', deleteError.message)
        } else {
          console.log('✅ Secret deleted after one-time view.')
        }
      }

      hasViewed = true
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

    try {
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

      data = fetchedData

      if (typeof fetchedData.expires_at === 'string' || typeof fetchedData.expires_at === 'number' || fetchedData.expires_at instanceof Date) {
        const expiry = new Date(fetchedData.expires_at)
        const now = new Date()

        if (expiry < now) {
          error = 'This secret has expired.'
          loading = false
          return
        }

        const diffMs = expiry.getTime() - now.getTime()
        const diffMinutes = Math.round(diffMs / 60000)

        if (diffMinutes <= 10) expiryLabel = '10 minutes'
        else if (diffMinutes <= 60) expiryLabel = '1 hour'
        else if (diffMinutes <= 1440) expiryLabel = '1 day'
        else expiryLabel = `${Math.round(diffMinutes / 1440)} days`
      } else {
        expiryLabel = 'one-time view'
      }
    } catch (err) {
      console.error('Error fetching secret:', err)
      error = 'Failed to load secret. Please check the URL and try again.'
    }

    loading = false
  })
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Header -->
    <div class="text-center mb-12">
      <div class="flex justify-between items-center mb-8">
        <a href="/" class="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
          ← Back to Create
        </a>
        <h1 class="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          🔐 PasswordBurn
        </h1>
        <button
          on:click={toggleTheme}
          class="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
          aria-label="Toggle theme"
        >
          {#if $theme === 'light'}
            🌙
          {:else}
            ☀️
          {/if}
        </button>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8">
      <div class="max-w-2xl mx-auto text-center">
        {#if loading}
          <div class="py-12">
            <div class="inline-block animate-spin text-4xl mb-4">⚡</div>
            <p class="text-xl text-gray-600 dark:text-gray-300">Loading secret...</p>
          </div>
        {:else if error}
          <div class="py-12">
            <div class="text-6xl mb-4">❌</div>
            <h2 class="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
            <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <a
              href="/"
              class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              🔗 Create New Secret
            </a>
          </div>
        {:else if data}
          {#if !viewed}
            <div class="py-12">
              <div class="text-6xl mb-4">🔒</div>
              <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Secret Ready to View</h2>
              <p class="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Click the button below to decrypt and view your secret.
              </p>
              <button
                class="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                on:click={viewSecret}
              >
                🔓 View Secret
              </button>
            </div>
          {:else}
            <div class="py-8">
              <div class="text-6xl mb-4">✅</div>
              <h2 class="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">Secret Revealed</h2>
              
              <div class="bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 p-6 rounded-2xl text-left mb-6">
                <p class="font-mono whitespace-pre-wrap text-gray-900 dark:text-gray-100 text-lg leading-relaxed">{decryptedSecret}</p>
              </div>
              
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                ⏳ This secret was set to expire after <strong class="text-gray-800 dark:text-gray-200">{expiryLabel}</strong>.
              </p>
              
              <div class="flex gap-4 justify-center mb-6">
                <button
                  class="bg-gray-800 dark:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  on:click={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url)
                      .then(() => console.log('Copied URL to clipboard'))
                      .catch((err) => console.error('Copy failed', err));
                  }}
                >
                  📋 Copy URL
                </button>
                <button
                  class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  on:click={() => {
                    if (decryptedSecret) navigator.clipboard.writeText(decryptedSecret);
                  }}
                >
                  📋 Copy Secret
                </button>
              </div>
              
              <a
                href="/"
                class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                🔗 Create New Secret
              </a>
              
              <p class="mt-6 text-sm text-gray-500 dark:text-gray-400">
                ⚠️ This secret is no longer available after this view.
              </p>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div>
