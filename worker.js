// Cloudflare Worker Proxy with RC4 Decryption for baxigpt.com
const KEY = "HNQ_SECURE_KEY_2026";

function rc4(key, str) {
  var s = [], j = 0, x, res = '';
  for (var i = 0; i < 256; i++) {
    s[i] = i;
  }
  for (var i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
    x = s[i]; s[i] = s[j]; s[j] = x;
  }
  var i = 0; j = 0;
  for (var y = 0; y < str.length; y++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    x = s[i]; s[i] = s[j]; s[j] = x;
    res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
  }
  return res;
}

function decryptPayload(encryptedBase64) {
  try {
    // 1. Decode base64 to binary-like string
    const encrypted = atob(encryptedBase64);
    // 2. Decrypt using RC4
    const utf8StrBase64 = rc4(KEY, encrypted);
    // 3. Decode base64 to original raw string
    const rawStr = decodeURIComponent(escape(atob(utf8StrBase64)));
    // 4. Parse JSON
    return JSON.parse(rawStr);
  } catch (e) {
    console.error("Decryption failed:", e);
    return null;
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Set CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Proxy path matching: convert /api/... to https://baxigpt.com/api/...
    if (url.pathname.startsWith("/api/")) {
      const targetUrl = "https://baxigpt.com" + url.pathname;
      
      let bodyText = "";
      let fetchBody = null;
      let contentType = request.headers.get("content-type") || "";

      if (request.method === "POST") {
        bodyText = await request.text();
        
        // Decrypt payload if client sent text/plain or encrypted format
        const decryptedJson = decryptPayload(bodyText);
        if (decryptedJson) {
          fetchBody = JSON.stringify(decryptedJson);
          contentType = "application/json";
        } else {
          // Fallback to raw body if decryption fails (or if it's already plain JSON for compatibility)
          fetchBody = bodyText;
        }
      }

      // Clone original headers but override host/origin/referer to avoid anti-proxy detection
      const newHeaders = new Headers(request.headers);
      newHeaders.set("Host", "baxigpt.com");
      newHeaders.set("Origin", "https://baxigpt.com");
      newHeaders.set("Referer", "https://baxigpt.com/");
      newHeaders.set("Content-Type", contentType);

      try {
        const backendResponse = await fetch(targetUrl, {
          method: request.method,
          headers: newHeaders,
          body: fetchBody
        });

        // Copy backend response headers and apply CORS
        const responseHeaders = new Headers(backendResponse.headers);
        for (const [key, val] of Object.entries(corsHeaders)) {
          responseHeaders.set(key, val);
        }

        // Return backend response
        return new Response(backendResponse.body, {
          status: backendResponse.status,
          statusText: backendResponse.statusText,
          headers: responseHeaders
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, msg: "Lỗi kết nối proxy: " + err.message }), {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
