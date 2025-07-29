export async function generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encrypt(secret: string, key: CryptoKey): Promise<{
    iv: string;
    ciphertext: string;
    rawKey: string;
}> {
    const encoder = new TextEncoder();
    const data = encoder.encode(secret);
    const ivBuffer = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: ivBuffer },
        key,
        data
    );

    // Export the key and encode as base64
    const rawKey = await crypto.subtle.exportKey("raw", key);
    const rawKeyB64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));

    return {
        iv: btoa(String.fromCharCode(...ivBuffer)),
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        rawKey: rawKeyB64
    };
}