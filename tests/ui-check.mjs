// Dependency-free browser regression checks. Run from the repository: node tests/ui-check.mjs
// Uses an isolated headless Chrome profile and blocks every Formspree request with fixtures.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, extname, join } from "node:path";

const root = process.cwd();
const output = resolve(process.env.KENTARA_QA_OUTPUT || join(tmpdir(), "kentara-ui-audit"));
await mkdir(output, { recursive: true });
const profile = await mkdtemp(join(tmpdir(), "kentara-chrome-"));
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, "http://localhost").pathname;
    const file = resolve(root, `.${pathname === "/" ? "/index.html" : decodeURIComponent(pathname)}`);
    if (!file.startsWith(root + "/") || pathname.includes("/.")) throw new Error("Invalid path");
    const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon" };
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    if (!res.headersSent) res.writeHead(404);
    res.end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const chrome = spawn(process.env.CHROME_BIN || "google-chrome", [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=${profile}`, "--remote-debugging-port=0", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
let chromeLog = "";
chrome.stderr.on("data", (chunk) => { chromeLog += chunk; });
let socket;
const results = [];
const errors = [];
let liveFormspreeRequests = 0;
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
let send;
let evaluate;
const check = (name, condition) => { assert.ok(condition, name); results.push(name); };

try {
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = Number((await readFile(join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]); break; }
    catch { await sleep(100); }
  }
  assert.ok(port, `Chrome did not start: ${chromeLog.slice(-1000)}`);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
  await new Promise((done, reject) => { socket.onopen = done; socket.onerror = reject; });
  const pending = new Map();
  let id = 0;
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const item = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(item.timeout);
      if (message.error) item.reject(new Error(JSON.stringify(message.error)));
      else item.resolve(message.result);
    } else if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails);
    else if (message.method === "Network.requestWillBeSent" && message.params.request.url.startsWith("https://formspree.io/")) liveFormspreeRequests++;
  };
  send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(`Timed out: ${method}`)); }, 20000);
    pending.set(requestId, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  if (process.env.KENTARA_QA_OFFLINE === "1") {
    await send("Network.setBlockedURLs", { urls: ["https://cdn.tailwindcss.com/*", "https://fonts.googleapis.com/*", "https://fonts.gstatic.com/*"] });
  }
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `
    window.__fixture = { mode: 'block', requests: [], pending: [] };
    const originalFetch = window.fetch.bind(window);
    window.fetch = (url, options) => {
      if (!String(url).startsWith('https://formspree.io/')) return originalFetch(url, options);
      const fixture = window.__fixture;
      fixture.requests.push({ url: String(url), method: options.method, headers: options.headers, fields: Object.fromEntries(options.body) });
      return new Promise((resolve, reject) => {
        const respond = (mode) => {
          if (mode === 'network' || mode === 'block') return reject(new TypeError('Mock network failure'));
          const data = mode === 'validation' ? { errors: [{field: 'email', message: 'Please use another email address.'}] }
            : mode === 'false-success' ? {ok: false}
            : mode === 'unexpected-json' ? {message: 'Not accepted'}
            : mode === 'server-error' ? {error: 'Service unavailable'}
            : {next: '/thanks', ok: true};
          resolve({ok: !['server-error','validation'].includes(mode), redirected: mode === 'redirect',
            json: async () => { if (mode === 'invalid-json') throw new SyntaxError('Mock invalid JSON'); return data; }});
        };
        if (fixture.mode === 'defer') fixture.pending.push(respond);
        else respond(fixture.mode);
        options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {once: true});
      });
    };
  ` });
  const viewport = async (width, height = 900) => send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  const navigate = async (page) => {
    await send("Page.navigate", { url: `${origin}/${page}` });
    for (let i = 0; i < 100; i++) {
      if (await evaluate(`location.pathname === ${JSON.stringify(`/${page}`.split("#")[0])} && document.readyState === 'complete'`)) break;
      await sleep(100);
    }
    await evaluate("document.fonts.ready.then(() => true)");
  };
  const screenshot = async (name, fullPage = false) => {
    await sleep(650); // Let native focus scrolling and CSS transitions finish.
    const dimensions = await evaluate("({width:innerWidth,height:document.documentElement.scrollHeight})");
    const options = fullPage ? { captureBeyondViewport: true, clip: { x: 0, y: 0, width: dimensions.width, height: dimensions.height, scale: 1 } } : {};
    const { data } = await send("Page.captureScreenshot", { format: "png", ...options });
    await writeFile(join(output, `${name}.png`), Buffer.from(data, "base64"));
  };
  const metrics = [];
  for (const width of [1440, 390, 320, 768, 960]) {
    await viewport(width, width < 700 ? 844 : 1000);
    for (const page of ["index.html", "about.html", "services.html", "start-project.html", "privacy.html"]) {
      await navigate(page);
      const layout = await evaluate(`(() => {
        const buttons = [...document.querySelectorAll('.btn-primary,.btn-secondary')].filter(el => el.getClientRects().length);
        return {page:location.pathname,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
          buttons:buttons.map(el => {const s=getComputedStyle(el),r=el.getBoundingClientRect();return {text:el.innerText.trim(),width:r.width,height:r.height,font:s.fontSize,padding:s.padding,radius:s.borderRadius,gap:s.gap};}),
          brokenImages:[...document.images].filter(el => el.complete && !el.naturalWidth).map(el => el.src),
          fieldOverflow:[...document.querySelectorAll('.form-field input,.form-field select,.form-field textarea')].filter(el=>el.getBoundingClientRect().right>innerWidth).length};
      })()`);
      metrics.push(layout);
      check(`${page} at ${width}px: no horizontal document overflow`, layout.scrollWidth <= width);
      check(`${page} at ${width}px: comfortable CTA targets`, layout.buttons.every((button) => button.height >= 44));
      check(`${page} at ${width}px: no broken local images`, layout.brokenImages.length === 0);
      check(`${page} at ${width}px: no field overflow`, layout.fieldOverflow === 0);
      if (width === 1440 || width === 390) {
        if (width === 1440) await writeFile(join(output, `${page.replace('.html','')}-rendered.txt`), await evaluate("document.body.innerText"));
        await screenshot(`${page.replace('.html','')}-${width}-top`);
        // Exercise normal reveal observers before taking the full-page evidence.
        await evaluate(`(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=600){window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,35));}window.scrollTo({top:0,behavior:'instant'});})()`);
        await sleep(350);
        await screenshot(`${page.replace('.html','')}-${width}-full`, true);
      }
    }
  }

  const fill = () => evaluate(`(() => {
    const values={full_name:'Kentara QA Fixture',email:'fixture@example.com',phone:'+234 800 000 0000',service_needed:'Not sure yet',project_challenge:'Local fixture: replace paper stock records and spreadsheets.',estimated_budget:'Not sure yet',payment_approach:"I'd like guidance"};
    for(const [name,value] of Object.entries(values)){const field=document.querySelector('[name="'+name+'"]');field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));}
    return values;
  })()`);
  const submit = () => evaluate("document.querySelector('.project-form').requestSubmit()");
  const settle = () => sleep(80);
  for (const width of [1440, 390, 320]) {
    await viewport(width, width === 1440 ? 1000 : 844);
    await navigate("start-project.html");
    await submit();
    check(`${width}px: required validation prevents requests`, await evaluate("__fixture.requests.length === 0 && document.querySelectorAll('[aria-invalid=true]').length === 5 && document.activeElement.id === 'full-name'"));
    await screenshot(`validation-${width}`, true);
    await fill();
    await evaluate("document.querySelector('[name=email]').value='not-an-email'");
    await submit();
    check(`${width}px: malformed email rejected without clearing other data`, await evaluate("__fixture.requests.length === 0 && document.querySelector('[name=full_name]').value==='Kentara QA Fixture' && document.activeElement.id==='email-address'"));
    await fill();
    await evaluate("document.querySelector('[name=full_name]').value='   '");
    await submit();
    check(`${width}px: whitespace-only required field rejected`, await evaluate("__fixture.requests.length === 0 && document.activeElement.id==='full-name'"));
    await navigate("start-project.html");
    await fill();
    await evaluate("__fixture.mode='defer'; document.querySelector('.form-submit').scrollIntoView({block:'center',behavior:'instant'})");
    const before = await evaluate("document.querySelector('.form-submit').getBoundingClientRect().toJSON()");
    await submit();
    await submit();
    const during = await evaluate(`(() => {const button=document.querySelector('.form-submit'), r=button.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top,disabled:button.disabled,requests:__fixture.requests.length,loading:document.querySelector('.submit-loading').innerText,spinner:getComputedStyle(document.querySelector('.button-spinner')).animationName,statusHidden:document.querySelector('.form-status').hidden,busy:document.querySelector('.project-form').getAttribute('aria-busy')};})()`);
    check(`${width}px: loading state blocks duplicate requests`, during.disabled && during.requests === 1 && during.busy === "true");
    check(`${width}px: button and loading label remain stable`, before.width === during.width && before.height === during.height && Math.abs(before.top - during.top) < 1 && during.loading === "Sending enquiry..." && during.statusHidden);
    check(`${width}px: normal-motion spinner animates`, during.spinner === "enquiry-spin");
    await screenshot(`loading-${width}`);
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    check(`${width}px: reduced-motion spinner remains static`, await evaluate("getComputedStyle(document.querySelector('.button-spinner')).animationName === 'none'"));
    await send("Emulation.setEmulatedMedia", { features: [] });
    await evaluate("__fixture.pending.shift()('success')");
    await settle();
    check(`${width}px: accepted response replaces entire card and focuses success`, await evaluate("document.querySelector('.intake-content').hidden && !document.querySelector('.form-success').hidden && document.activeElement.matches('.form-success') && !document.querySelector('.project-form').hasAttribute('aria-busy')"));
    check(`${width}px: checkmark and homepage link visible`, await evaluate("document.querySelector('.success-icon svg').getBoundingClientRect().width===30 && document.querySelector('.form-success a').getAttribute('href')==='index.html'"));
    check(`${width}px: success icon and heading clear the sticky header`, await evaluate("document.querySelector('.success-icon').getBoundingClientRect().top >= document.querySelector('.header-nav').getBoundingClientRect().bottom && document.querySelector('.form-success h2').getBoundingClientRect().bottom < innerHeight"));
    check(`${width}px: payload preserves endpoint and field names`, await evaluate("__fixture.requests[0].url==='https://formspree.io/f/xvkazbdn' && __fixture.requests[0].method==='POST' && __fixture.requests[0].headers.Accept==='application/json' && Object.keys(__fixture.requests[0].fields).sort().join(',')==='_gotcha,email,estimated_budget,full_name,payment_approach,phone,project_challenge,service_needed'"));
    await screenshot(`success-${width}`);
    await submit();
    check(`${width}px: completed submission cannot be repeated`, await evaluate("__fixture.requests.length === 1"));

    for (const mode of ["server-error", "network", "validation", "invalid-json", "false-success", "unexpected-json", "redirect"]) {
      await navigate("start-project.html");
      const values = await fill();
      await evaluate(`__fixture.mode=${JSON.stringify(mode)}`);
      await submit();
      await settle();
      check(`${width}px: ${mode} preserves fields, shows contact and restores button`, await evaluate(`(() => {const values=${JSON.stringify(values)}; return Object.entries(values).every(([name,value])=>document.querySelector('[name="'+name+'"]').value===value) && !document.querySelector('.intake-content').hidden && document.querySelector('.form-success').hidden && !document.querySelector('.form-submit').disabled && !document.querySelector('.form-status').hidden && document.querySelector('.form-status a').href==='mailto:info@kentaratech.com' && document.activeElement.matches('.form-status') && !document.querySelector('.project-form').hasAttribute('aria-busy');})()`));
      if (mode === "validation") check(`${width}px: provider field error associated with input`, await evaluate("document.querySelector('[name=email]').getAttribute('aria-describedby')==='email-address-error' && document.getElementById('email-address-error').textContent==='Please use another email address.'"));
      if (mode === "server-error") await screenshot(`error-${width}`);
      await evaluate("__fixture.mode='success'");
      await submit();
      await settle();
      check(`${width}px: ${mode} can retry successfully`, await evaluate("!document.querySelector('.form-success').hidden && __fixture.requests.length===2"));
    }
  }

  await viewport(1440, 1000);
  await navigate("start-project.html");
  await fill();
  await evaluate(`(async () => {const script=document.createElement('script');script.src='assets/js/project-form.js';document.body.append(script);await new Promise(resolve=>script.onload=resolve);__fixture.mode='defer';document.querySelector('.form-submit').focus();})()`);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await settle();
  check("Enter submits and repeated initialization does not duplicate requests", await evaluate("__fixture.requests.length===1 && document.querySelector('.form-submit').disabled"));
  await evaluate("__fixture.pending.shift()('success')");
  await settle();
  check("keyboard submission completes with success focus", await evaluate("document.activeElement.matches('.form-success')"));

  await navigate("start-project.html");
  await fill();
  await evaluate("__fixture.mode='defer'");
  await submit();
  // Real 30-second deadline, with a request fixture that only responds to AbortSignal.
  await sleep(30500);
  check("30-second request timeout restores the form and preserves input", await evaluate("!document.querySelector('.form-submit').disabled && !document.querySelector('.form-status').hidden && document.querySelector('[name=full_name]').value==='Kentara QA Fixture' && document.querySelector('.form-success').hidden"));

  await viewport(390, 844);
  await navigate("index.html");
  await evaluate("document.getElementById('mobile-menu-toggle').click()");
  check("mobile menu opens with focus and modal semantics", await evaluate("document.getElementById('mobile-nav-overlay').open && document.activeElement.id==='mobile-menu-close' && document.getElementById('mobile-menu-toggle').getAttribute('aria-expanded')==='true'"));
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", modifiers: 8, windowsVirtualKeyCode: 9 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", modifiers: 8, windowsVirtualKeyCode: 9 });
  check("mobile menu Shift+Tab wraps to CTA", await evaluate("document.activeElement.matches('.mobile-nav-cta .btn-primary')"));
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await settle();
  check("mobile Escape restores menu trigger focus", await evaluate("!document.getElementById('mobile-nav-overlay').open && document.activeElement.id==='mobile-menu-toggle'"));
  await navigate("services.html#mobile-development");
  check("service deep link opens matching disclosure", await evaluate("document.getElementById('mobile-development').open"));
  await navigate("start-project.html");
  await evaluate("document.querySelector('[name=payment_approach]').focus()");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  check("payment guidance is reachable in the form Tab order", await evaluate("document.activeElement.matches('.payment-guidance summary')"));
  for (let step=0; step<5 && !await evaluate("document.activeElement.matches('.form-submit')"); step++) {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  }
  check("submit has visible keyboard focus", await evaluate("document.querySelector('.form-submit').matches(':focus-visible') && getComputedStyle(document.querySelector('.form-submit')).outlineWidth==='3px'"));
  await viewport(1440, 1000);
  await navigate("services.html");
  await evaluate("document.querySelectorAll('.service-detail,.support-detail').forEach(el=>{if(!el.open)el.querySelector('summary').click()})");
  await evaluate(`(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=600){window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,35));}window.scrollTo({top:0,behavior:'instant'});})()`);
  await screenshot("services-expanded-1440-full", true);
  await writeFile(join(output, "services-expanded-rendered.txt"), await evaluate("document.body.innerText"));
  await viewport(390, 844);
  await navigate("start-project.html");
  check("payment selector has associated guidance", await evaluate("document.querySelector('[name=payment_approach]').getAttribute('aria-describedby')==='payment-help' && document.getElementById('payment-help').textContent.includes('not a commitment')"));
  await evaluate("document.querySelector('.payment-guidance summary').focus()");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  check("payment comparison opens with Enter", await evaluate("document.querySelector('.payment-guidance').open"));
  check("payment comparison retains eligibility and existing terms link", await evaluate("document.querySelector('.payment-guidance').innerText.includes('Subject to eligibility and approval') && document.querySelector('.payment-guidance a').getAttribute('href')==='#payment-options'"));
  check("under-24-hour expectation appears before and after submission", await evaluate("document.querySelector('.form-reply').textContent.includes('under 24 hours') && document.querySelector('.form-success').textContent.includes('under 24 hours')"));
  await evaluate("document.querySelector('.payment-guidance').scrollIntoView({block:'start',behavior:'instant'})");
  await screenshot("payment-guidance-390");
  check("form links to the Kentara privacy notice", await evaluate("document.querySelector('.form-privacy a').getAttribute('href')==='privacy.html'"));
  check("no uncaught browser JavaScript exceptions", errors.length === 0);
  check("no live Formspree requests reached the network", liveFormspreeRequests === 0);
  await writeFile(join(output, "results.json"), JSON.stringify({ passed: results.length, results, metrics, errors, liveFormspreeRequests, offlineAssets: process.env.KENTARA_QA_OFFLINE === "1" }, null, 2));
  console.log(`${results.length} checks passed. Screenshots and results: ${output}`);
} catch (error) {
  const diagnostic = evaluate ? await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,active:document.activeElement?.outerHTML,requests:window.__fixture?.requests,overflow:[...document.querySelectorAll('body *')].filter(el=>el.getClientRects().length && el.getBoundingClientRect().right>innerWidth).map(el=>({tag:el.tagName,class:el.className,width:el.getBoundingClientRect().width,right:el.getBoundingClientRect().right}))})`).catch(() => null) : null;
  await writeFile(join(output, "failure.json"), JSON.stringify({ message: error.message, passed: results, errors, diagnostic }, null, 2));
  throw error;
} finally {
  socket?.close();
  chrome.kill();
  await new Promise((done) => server.close(done));
  await sleep(200);
  await rm(profile, { recursive: true, force: true, maxRetries: 3 });
}
