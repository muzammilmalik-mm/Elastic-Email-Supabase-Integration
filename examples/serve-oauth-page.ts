import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const html = await Deno.readTextFile("./oauth-web-interface.html");

console.log("🌐 Server running at http://localhost:8000");
console.log("📝 Open your browser to: http://localhost:8000");

serve((req) => {
    return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
    });
}, { port: 8000 });
