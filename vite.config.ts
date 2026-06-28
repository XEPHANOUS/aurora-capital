import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import process from "node:process";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname
const execFileAsync = promisify(execFile)

let previousCpuTimes: ReturnType<typeof os.cpus> | null = null

function computeCpuUsagePercent(): number {
  const current = os.cpus()
  if (!previousCpuTimes) {
    previousCpuTimes = current
    return 0
  }

  let idleDiff = 0
  let totalDiff = 0

  for (let i = 0; i < current.length; i++) {
    const prev = previousCpuTimes[i]?.times
    const now = current[i].times
    if (!prev) continue

    const prevTotal = prev.user + prev.nice + prev.sys + prev.irq + prev.idle
    const nowTotal = now.user + now.nice + now.sys + now.irq + now.idle
    totalDiff += nowTotal - prevTotal
    idleDiff += now.idle - prev.idle
  }

  previousCpuTimes = current

  if (totalDiff <= 0) return 0
  const usage = 100 * (1 - idleDiff / totalDiff)
  return Math.max(0, Math.min(100, usage))
}

async function readGpuMetrics() {
  try {
    const { stdout } = await execFileAsync("nvidia-smi", [
      "--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu",
      "--format=csv,noheader,nounits",
    ])

    const firstLine = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)[0]

    if (!firstLine) {
      return {
        gpuPercent: 0,
        gpuMemoryUsedMb: 0,
        gpuMemoryTotalMb: 0,
        gpuTemperatureC: 0,
        source: "unavailable",
      }
    }

    const [util, memUsed, memTotal, temperature] = firstLine.split(",").map((part) => Number.parseFloat(part.trim()))

    return {
      gpuPercent: Number.isFinite(util) ? util : 0,
      gpuMemoryUsedMb: Number.isFinite(memUsed) ? memUsed : 0,
      gpuMemoryTotalMb: Number.isFinite(memTotal) ? memTotal : 0,
      gpuTemperatureC: Number.isFinite(temperature) ? temperature : 0,
      source: "nvidia-smi",
    }
  } catch {
    return {
      gpuPercent: 0,
      gpuMemoryUsedMb: 0,
      gpuMemoryTotalMb: 0,
      gpuTemperatureC: 0,
      source: "unavailable",
    }
  }
}

async function readPowerShellJson<T>(script: string): Promise<T | null> {
  try {
    const { stdout } = await execFileAsync("powershell", [
      "-NoProfile",
      "-Command",
      script,
    ])

    const clean = stdout.trim()
    if (!clean) return null
    return JSON.parse(clean) as T
  } catch {
    return null
  }
}

async function readCpuAdvanced(cpuPercent: number) {
  if (os.platform() !== "win32") {
    return {
      cpuTemperatureC: 0,
      cpuFrequencyMhz: 0,
      activeCores: Math.max(1, Math.round((os.cpus().length * cpuPercent) / 100)),
    }
  }

  const payload = await readPowerShellJson<{
    CurrentClockSpeed?: number
    MaxClockSpeed?: number
    TemperatureC?: number
  }>(
    "try { " +
      "$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1 CurrentClockSpeed,MaxClockSpeed; " +
      "$tempRaw = Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction SilentlyContinue | Select-Object -First 1 CurrentTemperature; " +
      "$tempC = if ($tempRaw.CurrentTemperature) { [math]::Round(($tempRaw.CurrentTemperature / 10) - 273.15, 1) } else { 0 }; " +
      "@{ CurrentClockSpeed = $cpu.CurrentClockSpeed; MaxClockSpeed = $cpu.MaxClockSpeed; TemperatureC = $tempC } | ConvertTo-Json -Compress " +
      "} catch { @{} | ConvertTo-Json -Compress }"
  )

  return {
    cpuTemperatureC: payload?.TemperatureC ?? 0,
    cpuFrequencyMhz: payload?.CurrentClockSpeed ?? payload?.MaxClockSpeed ?? 0,
    activeCores: Math.max(1, Math.round((os.cpus().length * cpuPercent) / 100)),
  }
}

async function readDiskMetrics() {
  if (os.platform() !== "win32") {
    return {
      diskFreeGb: 0,
      diskUsedGb: 0,
      auroraDiskUsedGb: 0,
      diskReadMbps: 0,
      diskWriteMbps: 0,
    }
  }

  const payload = await readPowerShellJson<{
    freeGb?: number
    usedGb?: number
    readBps?: number
    writeBps?: number
  }>(
    "try { " +
      "$d = Get-PSDrive -Name C -ErrorAction Stop; " +
      "$r = (Get-Counter '\\PhysicalDisk(_Total)\\Disk Read Bytes/sec').CounterSamples | Select-Object -First 1 CookedValue; " +
      "$w = (Get-Counter '\\PhysicalDisk(_Total)\\Disk Write Bytes/sec').CounterSamples | Select-Object -First 1 CookedValue; " +
      "@{ freeGb = [math]::Round($d.Free / 1GB, 2); usedGb = [math]::Round(($d.Used) / 1GB, 2); readBps = [double]$r.CookedValue; writeBps = [double]$w.CookedValue } | ConvertTo-Json -Compress " +
      "} catch { @{} | ConvertTo-Json -Compress }"
  )

  return {
    diskFreeGb: payload?.freeGb ?? 0,
    diskUsedGb: payload?.usedGb ?? 0,
    auroraDiskUsedGb: 0,
    diskReadMbps: ((payload?.readBps ?? 0) * 8) / 1_000_000,
    diskWriteMbps: ((payload?.writeBps ?? 0) * 8) / 1_000_000,
  }
}

async function readNetworkMetrics() {
  if (os.platform() !== "win32") {
    return {
      latencyMs: 0,
      downloadMbps: 0,
      uploadMbps: 0,
    }
  }

  const payload = await readPowerShellJson<{
    latencyMs?: number
    downBps?: number
    upBps?: number
  }>(
    "try { " +
      "$p = Test-Connection -ComputerName 1.1.1.1 -Count 1 -ErrorAction SilentlyContinue; " +
      "$lat = if ($p) { [math]::Round($p.Latency, 2) } else { 0 }; " +
      "$rx = (Get-Counter '\\Network Interface(*)\\Bytes Received/sec').CounterSamples | Measure-Object -Property CookedValue -Sum; " +
      "$tx = (Get-Counter '\\Network Interface(*)\\Bytes Sent/sec').CounterSamples | Measure-Object -Property CookedValue -Sum; " +
      "@{ latencyMs = $lat; downBps = [double]$rx.Sum; upBps = [double]$tx.Sum } | ConvertTo-Json -Compress " +
      "} catch { @{} | ConvertTo-Json -Compress }"
  )

  return {
    latencyMs: payload?.latencyMs ?? 0,
    downloadMbps: ((payload?.downBps ?? 0) * 8) / 1_000_000,
    uploadMbps: ((payload?.upBps ?? 0) * 8) / 1_000_000,
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
    {
      name: "system-metrics-api",
      configureServer(server) {
        server.middlewares.use("/api/system/metrics", async (_req, res) => {
          const cpuPercent = computeCpuUsagePercent()
          const cpuAdvanced = await readCpuAdvanced(cpuPercent)
          const totalMem = os.totalmem()
          const freeMem = os.freemem()
          const ramPercent = totalMem > 0 ? ((totalMem - freeMem) / totalMem) * 100 : 0
          const gpu = await readGpuMetrics()
          const disk = await readDiskMetrics()
          const network = await readNetworkMetrics()
          const memory = process.memoryUsage()

          const payload = {
            timestamp: new Date().toISOString(),
            cpuPercent,
            cpuTemperatureC: cpuAdvanced.cpuTemperatureC,
            cpuFrequencyMhz: cpuAdvanced.cpuFrequencyMhz,
            cpuActiveCores: cpuAdvanced.activeCores,
            ramPercent,
            ramUsedGb: (totalMem - freeMem) / (1024 ** 3),
            ramTotalGb: totalMem / (1024 ** 3),
            auroraRamUsedGb: memory.rss / (1024 ** 3),
            gpuPercent: gpu.gpuPercent,
            gpuMemoryUsedGb: gpu.gpuMemoryUsedMb / 1024,
            gpuMemoryTotalGb: gpu.gpuMemoryTotalMb / 1024,
            gpuTemperatureC: gpu.gpuTemperatureC,
            gpuSource: gpu.source,
            diskFreeGb: disk.diskFreeGb,
            diskUsedGb: disk.diskUsedGb,
            auroraDiskUsedGb: disk.auroraDiskUsedGb,
            diskReadMbps: disk.diskReadMbps,
            diskWriteMbps: disk.diskWriteMbps,
            networkLatencyMs: network.latencyMs,
            networkDownloadMbps: network.downloadMbps,
            networkUploadMbps: network.uploadMbps,
            host: {
              platform: os.platform(),
              cpuModel: os.cpus()[0]?.model ?? "unknown",
              cpuCores: os.cpus().length,
            },
          }

          res.statusCode = 200
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify(payload))
        })

        const coinMarketProQuotesProxy = async (req: import('http').IncomingMessage, res: import('http').ServerResponse) => {
          try {
            const requestUrl = new URL(req.url ?? "", "http://localhost")
            const symbols = requestUrl.searchParams.get("symbols")?.trim() ?? "BTC,ETH"
            const convert = requestUrl.searchParams.get("convert")?.trim() ?? "USD"
            const baseUrl = requestUrl.searchParams.get("baseUrl")?.trim() ?? "https://pro-api.coinmarketcap.com"
            const apiKey = requestUrl.searchParams.get("apiKey")?.trim() ?? ""

            if (!apiKey) {
              res.statusCode = 400
              res.setHeader("Content-Type", "application/json")
              res.end(JSON.stringify({ error: "Missing apiKey" }))
              return
            }

            const normalizedBaseUrl = baseUrl.replace(/\/+$/, "")
            const endpoint = `${normalizedBaseUrl}/v1/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(symbols)}&convert=${encodeURIComponent(convert)}`

            const response = await fetch(endpoint, {
              method: "GET",
              headers: {
                Accept: "application/json",
                "X-CMC_PRO_API_KEY": apiKey,
              },
            })

            const bodyText = await response.text()
            res.statusCode = response.status
            res.setHeader("Content-Type", "application/json")
            res.end(bodyText)
          } catch (error) {
            res.statusCode = 500
            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify({
              error: error instanceof Error ? error.message : "Unexpected CoinMarketPro proxy error",
            }))
          }
        }

        server.middlewares.use("/api/coinmarketpro/quotes", coinMarketProQuotesProxy)
        server.middlewares.use("/api/coinmarketcap/quotes", coinMarketProQuotesProxy)
      },
    } as PluginOption,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
});
