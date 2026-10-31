// A share normally stays in the installed app's service worker. Do not parse or log a POST fallback.
export const config = { api: { bodyParser: false } };
export default function handler(_req,res){res.setHeader('Cache-Control','no-store');res.writeHead(303,{Location:'/?share=missing'});res.end();}
