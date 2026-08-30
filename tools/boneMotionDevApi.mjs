import { promises as fs } from 'node:fs'
import path from 'node:path'

const sendJson = (res, status, payload) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

const readBody = req => new Promise((resolve, reject) => {
  let body = ''
  req.setEncoding('utf8')
  req.on('data', chunk => {
    body += chunk
    if (body.length > 30 * 1024 * 1024) {
      reject(new Error('画像を含む保存データが30MBを超えています'))
      req.destroy()
    }
  })
  req.on('end', () => resolve(body))
  req.on('error', reject)
})

const validateProject = project => {
  const hasLegacyFrames = Array.isArray(project?.frames) && project.frames.length > 0
  const hasAnimationModel = project?.defaultFrame && typeof project.defaultFrame === 'object' && Array.isArray(project.animations)
  if (!project || !Array.isArray(project.layerOrder) || !project.layers || (!hasLegacyFrames && !hasAnimationModel)) {
    throw new Error('ボーン、レイヤー順、デフォルト姿勢、派生アニメーションが揃ったプロジェクトが必要です')
  }
}

export const boneMotionDevApi = () => {
  const libraryPath = path.resolve('src/data/motion/boneMotionProjects.json')

  return {
    name: 'bone-motion-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/local/bone-motion-projects', async (req, res, next) => {
        if (!['GET', 'PUT', 'DELETE'].includes(req.method)) return next()

        try {
          const library = JSON.parse(await fs.readFile(libraryPath, 'utf8'))
          if (req.method === 'GET') {
            const requestUrl = new URL(req.url || '/', 'http://local')
            const projectId = requestUrl.searchParams.get('id')
            if (projectId) {
              const entry = library.projects.find(project => project.id === projectId)
              if (!entry) return sendJson(res, 404, { error: '指定したモーションデータが見つかりません' })
              return sendJson(res, 200, entry)
            }
            if (requestUrl.searchParams.get('summary') === '1') {
              return sendJson(res, 200, {
                version: library.version,
                projects: library.projects.map(entry => ({
                  id: entry.id,
                  name: entry.name,
                  updatedAt: entry.updatedAt,
                  rigType: entry.project?.meta?.rigType || '',
                  poseType: entry.project?.meta?.poseType || '',
                  animations: (entry.project?.animations || []).map(animation => ({
                    id: animation.id,
                    name: animation.name,
                    frameCount: Array.isArray(animation.frames) ? animation.frames.length : 0
                  }))
                }))
              })
            }
            return sendJson(res, 200, library)
          }

          const body = JSON.parse(await readBody(req))
          if (!body?.id || typeof body.id !== 'string') throw new Error('保存IDが必要です')
          const nextLibrary = JSON.parse(JSON.stringify(library))
          const index = nextLibrary.projects.findIndex(item => item.id === body.id)

          if (req.method === 'DELETE') {
            if (index < 0) return sendJson(res, 404, { error: '削除対象が見つかりません' })
            nextLibrary.projects.splice(index, 1)
          } else {
            validateProject(body.project)
            const entry = {
              id: body.id,
              name: String(body.name || body.project.meta?.name || body.id).trim(),
              updatedAt: new Date().toISOString(),
              project: body.project
            }
            if (index < 0) nextLibrary.projects.push(entry)
            else nextLibrary.projects[index] = entry
          }

          nextLibrary.projects.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
          const tempPath = `${libraryPath}.${process.pid}.tmp`
          await fs.mkdir(path.dirname(libraryPath), { recursive: true })
          await fs.writeFile(tempPath, `${JSON.stringify(nextLibrary, null, 2)}\n`, 'utf8')
          await fs.rename(tempPath, libraryPath)
          return sendJson(res, 200, nextLibrary)
        } catch (error) {
          console.error('[bone-motion-projects]', error)
          return sendJson(res, 400, { error: error.message || 'ボーンモーションJSONの保存に失敗しました' })
        }
      })
    }
  }
}
