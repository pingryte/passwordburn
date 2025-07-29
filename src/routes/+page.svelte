<script lang="ts">
  let secret = '';
  let expiry = '10m';

  const handleSubmit = () => {
    console.log('Secret:', secret);
    console.log('Expiry:', expiry);
    // TODO: Replace with Supabase call
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
</main>