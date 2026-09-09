import { writeFile } from 'node:fs/promises'

const [url, output, rawPort = '9351'] = process.argv.slice(2)
if (!url || !output) throw new Error('usage: node capture-cdp.mjs <url> <output.png> [debug-port]')

const port = Number(rawPort)
const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' }).then((response) => {
  if (!response.ok) throw new Error(`cannot create browser target: ${response.status}`)
  return response.json()
})

const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

let nextId = 1
const pending = new Map()
const eventWaiters = new Map()

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) reject(new Error(message.error.message))
    else resolve(message.result || {})
    return
  }
  const waiters = eventWaiters.get(message.method)
  if (waiters?.length) waiters.shift()(message.params || {})
})

function send(method, params = {}) {
  const id = nextId++
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

function waitForEvent(method, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), timeout)
    const wrapped = (value) => {
      clearTimeout(timer)
      resolve(value)
    }
    const waiters = eventWaiters.get(method) || []
    waiters.push(wrapped)
    eventWaiters.set(method, waiters)
  })
}

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: 1600,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
})
const loaded = waitForEvent('Page.loadEventFired')
await send('Page.navigate', { url })
await loaded
await new Promise((resolve) => setTimeout(resolve, 5000))

for (const label of ['继续', '稍后配置']) {
  await send('Runtime.evaluate', {
    expression: `(() => {
      const button = [...document.querySelectorAll('button')]
        .find((item) => item.textContent.trim() === ${JSON.stringify(label)})
      if (button) button.click()
      return Boolean(button)
    })()`,
    returnByValue: true,
  })
  await new Promise((resolve) => setTimeout(resolve, 2500))
}

await send('Runtime.evaluate', {
  expression: `(() => {
    const target = [...document.querySelectorAll('button, a, [role="button"]')]
      .find((item) => item.textContent.trim() === '数字员工广场')
    if (target) target.click()
    return Boolean(target)
  })()`,
  returnByValue: true,
})
await new Promise((resolve) => setTimeout(resolve, 3000))

const evaluated = await send('Runtime.evaluate', {
  expression: 'document.body.innerText',
  returnByValue: true,
})
const screenshot = await send('Page.captureScreenshot', {
  format: 'png',
  captureBeyondViewport: false,
})
await writeFile(output, Buffer.from(screenshot.data, 'base64'))
socket.close()

console.log(JSON.stringify({
  ok: true,
  url,
  output,
  text: String(evaluated.result?.value || '').slice(0, 2000),
}))
