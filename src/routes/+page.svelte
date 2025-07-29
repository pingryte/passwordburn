<script lang="ts">
  console.log("ENV TEST", import.meta.env.PUBLIC_SUPABASE_URL);
  import { generateKey, encrypt } from '$lib/crypto';
  import { getSupabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let secret = '';
  let expiry = '10m';
  let generatedUrl: string | null = null;

  const handleSubmit = async () => {
    const supabase = getSupabase();

    if (!secret.trim()) {
      alert("Secret cannot be empty.");
      return;
    }

    console.log("Submitting secret:", secret);
    console.log("Expiry:", expiry);

    const key = await generateKey();
    const { ciphertext, iv, rawKey } = await encrypt(secret, key);

    const now = new Date();
    let expires_at = null;
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
  };
</script>

<main class="max-w-xl mx-auto mt-16 px-4">
  <h1 class="text-3xl font-bold mb-6 text-center">🔐 PasswordBurn</h1>

  <label for="secret" class="block mb-2 font-semibold">Secret</label>
  <textarea
    id="secret"
    bind:value={secret}
    rows="5"
    class="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="Paste your password, API key, or message here..."
  ></textarea>

  <label for="expiry" class="block mt-6 mb-2 font-semibold">Expiry</label>
  <select
    id="expiry"
    bind:value={expiry}
    class="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="10m">10 minutes</option>
    <option value="1h">1 hour</option>
    <option value="1d">1 day</option>
    <option value="one-time">One-time view</option>
  </select>

  <button
    class="mt-6 w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700"
    on:click={handleSubmit}
  >
    🔗 Generate Link
  </button>

  {#if generatedUrl}
    <div class="mt-6 bg-gray-100 p-4 rounded-md">
      <p class="break-all font-mono text-sm">{generatedUrl}</p>
      <button
        class="mt-2 bg-black text-white px-4 py-2 rounded"
        on:click={() => {
          if (generatedUrl) navigator.clipboard.writeText(generatedUrl);
        }}
      >
        📋 Copy Link
      </button>
    </div>
    <p class="mt-4 text-sm text-gray-500">⚠️ This link will expire after one view.</p>
  {/if}
</main>