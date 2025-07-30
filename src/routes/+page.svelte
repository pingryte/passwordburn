<script lang="ts">
  console.log("ENV TEST", import.meta.env.PUBLIC_SUPABASE_URL);
  import { generateKey, encrypt } from '$lib/crypto';
  import { getSupabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { theme } from '$lib/theme';

  let secret = '';
  let expiry = '10m';
  let generatedUrl: string | null = null;
  let isGenerating = false;

  const toggleTheme = () => {
    theme.update(current => current === 'light' ? 'dark' : 'light');
  };

  const handleSubmit = async () => {
    const supabase = getSupabase();

    if (!secret.trim()) {
      alert("Secret cannot be empty.");
      return;
    }

    isGenerating = true;
    console.log("Submitting secret:", secret);
    console.log("Expiry:", expiry);

    try {
      const key = await generateKey();
      const { ciphertext, iv, rawKey } = await encrypt(secret, key);

      const now = new Date();
      let expires_at: string | null = null;
      if (expiry !== 'one-time') {
        const multiplierMap = { '10m': 10, '1h': 60, '1d': 1440 };
        const multiplier = multiplierMap[expiry as keyof typeof multiplierMap];

        if (multiplier === undefined) {
          alert('Invalid expiry value');
          return;
        }

        expires_at = new Date(now.getTime() + multiplier * 60000).toISOString();
      }

      const { data, error } = await supabase
        .from('secrets')
        .insert([{ ciphertext, iv, expires_at }])
        .select('id')
        .single();

      if (error || !data) {
        alert('Error saving secret');
        console.error(error);
        return;
      }

      const url = `${window.location.origin}/s/${data.id}#${rawKey}`;
      generatedUrl = url;
    } catch (error) {
      console.error('Error generating link:', error);
      alert('Failed to generate link. Please try again.');
    } finally {
      isGenerating = false;
    }
  };
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Header -->
    <div class="text-center mb-12">
      <div class="flex justify-between items-center mb-8">
        <div></div>
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
      <p class="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Share sensitive information securely with self-destructing links
      </p>
    </div>

    <!-- Main Form Card -->
    <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 mb-8">
      <div class="max-w-2xl mx-auto space-y-8">
        <!-- Secret Input -->
        <div>
          <label for="secret" class="block text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            Your Secret
          </label>
          <textarea
            id="secret"
            bind:value={secret}
            rows="6"
            class="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none transition-all duration-300"
            placeholder="Paste your password, API key, or any sensitive message here..."
          ></textarea>
        </div>

        <!-- Expiry Selection -->
        <div>
          <label for="expiry" class="block text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            Expiry Time
          </label>
          <select
            id="expiry"
            bind:value={expiry}
            class="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 transition-all duration-300"
          >
            <option value="10m">⏰ 10 minutes</option>
            <option value="1h">⏰ 1 hour</option>
            <option value="1d">⏰ 1 day</option>
            <option value="one-time">💥 One-time view</option>
          </select>
        </div>

        <!-- Generate Button -->
        <button
          class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          on:click={handleSubmit}
          disabled={isGenerating}
        >
          {#if isGenerating}
            <span class="inline-block animate-spin mr-2">⚡</span> Generating...
          {:else}
            🔗 Generate Secure Link
          {/if}
        </button>
      </div>
    </div>

    <!-- Generated URL Section -->
    {#if generatedUrl}
      <div class="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 backdrop-blur-sm rounded-3xl shadow-xl border border-green-200/50 dark:border-green-700/50 p-8">
        <div class="max-w-2xl mx-auto">
          <h3 class="text-xl font-semibold mb-4 text-green-800 dark:text-green-300 flex items-center">
            ✅ Link Generated Successfully
          </h3>
          <div class="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 mb-4">
            <p class="break-all font-mono text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">{generatedUrl}</p>
          </div>
          <div class="flex gap-4">
            <button
              class="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              on:click={() => {
                if (generatedUrl) navigator.clipboard.writeText(generatedUrl);
              }}
            >
              📋 Copy Link
            </button>
            <a
              href={generatedUrl}
              target="_blank"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
            >
              🔗 Test Link
            </a>
          </div>
          <p class="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
            ⚠️ This link will expire after one view or the selected time period.
          </p>
        </div>
      </div>
    {/if}
  </div>
</div>