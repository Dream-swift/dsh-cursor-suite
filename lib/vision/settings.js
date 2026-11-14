/**
 * dsh-read-image-bridge runtime settings.
 *
 * One JSON file under the DSH home holds the vision route picked in
 * Settings → 图片识读. Every read resolves its route from this file first, so a
 * saved choice applies to the next image instead of the next restart; the
 * plugin config in `cordis.patch.yml` stays the fallback, and "恢复默认"
 * deletes the file to bring those values back.
 *
 * The file is the whole state: no in-process copy is kept, so the settings page
 * (same host process, different route) and the tool can never disagree about
 * what was last saved.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** Longest provider or model id this file accepts. */
const MAX_TEXT = 200

/** Provider and model ids are identifiers; a control character is a bug. */
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/

/** `$DSH_HOME` or `~/.dsh`, the home every DSH plugin state file lives in. */
export function dshHome(env = process.env) {
  return env.DSH_HOME || join(env.USERPROFILE || env.HOME || homedir(), '.dsh')
}

/** Absolute path of this plugin's settings file. */
export function settingsPath(env = process.env) {
  return join(dshHome(env), 'read-image-bridge.json')
}

/** Read one settings object; a broken file is reported, never thrown. */
function readObject(path) {
  if (!existsSync(path)) return { data: {}, exists: false, error: null }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'))
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return { data: {}, exists: true, error: '配置文件不是 JSON 对象' }
    }
    return { data: raw, exists: true, error: null }
  } catch (error) {
    return { data: {}, exists: true, error: `配置文件无法解析：${error?.message ?? error}` }
  }
}

/** Replace the file in one step, so a crash cannot leave half a route behind. */
function writeObject(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  const temporary = `${path}.${process.pid}.tmp`
  try {
    writeFileSync(temporary, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 })
    renameSync(temporary, path)
  } finally {
    if (existsSync(temporary)) rmSync(temporary, { force: true })
  }
}

/** One required identifier. */
function text(value, field) {
  if (typeof value !== 'string') throw new Error(`${field} 必须是字符串`)
  const trimmed = value.trim()
  if (trimmed === '') throw new Error(`${field} 不能为空`)
  if (trimmed.length > MAX_TEXT) throw new Error(`${field} 太长（最多 ${MAX_TEXT} 字）`)
  if (CONTROL_CHARACTERS.test(trimmed)) throw new Error(`${field} 含有控制字符`)
  return trimmed
}

/**
 * The route this deployment last saved, if any.
 * @param env - process environment to resolve the DSH home from.
 * @returns `path`, whether the file exists, any read error, and the saved route
 *   (`undefined` when the file does not set it).
 */
export function readVisionSettings(env = process.env) {
  const path = settingsPath(env)
  const raw = readObject(path)
  const provider = typeof raw.data.visionProvider === 'string' ? raw.data.visionProvider.trim() : ''
  const model = typeof raw.data.visionModel === 'string' ? raw.data.visionModel.trim() : ''
  return {
    path,
    exists: raw.exists,
    error: raw.error,
    visionProvider: provider === '' ? undefined : provider,
    visionModel: model === '' ? undefined : model,
  }
}

/**
 * Save the vision route. Both halves are required: a provider without its model
 * would pair the chosen provider with whatever the file happened to hold.
 * @returns the stored settings, read back from disk.
 */
export function writeVisionSettings(patch = {}, env = process.env) {
  const visionProvider = text(patch.visionProvider, 'visionProvider')
  const visionModel = text(patch.visionModel, 'visionModel')
  const path = settingsPath(env)
  const { data } = readObject(path)
  writeObject(path, { ...data, visionProvider, visionModel })
  return readVisionSettings(env)
}

/** Drop the saved route, handing the decision back to the plugin config. */
export function clearVisionSettings(env = process.env) {
  const path = settingsPath(env)
  try {
    rmSync(path, { force: true })
  } catch (error) {
    throw new Error(`cannot reset "${path}": ${error?.message ?? error}`)
  }
}
