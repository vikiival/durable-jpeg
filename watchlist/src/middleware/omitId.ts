import { MiddlewareHandler } from 'hono'

function omitId<T extends Record<string, any>>(data: T | T[]): Omit<T, 'id'> | Omit<T, 'id'>[] {
  if (Array.isArray(data)) {
    return data.map((item) => omitId(item) as Omit<T, 'id'>)
  } else if (typeof data === 'object' && data !== null) {
    const result: Record<string, any> = {}
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === 'object') {
        result[key] = omitId(data[key]) as Omit<T, 'id'>
      } else if (key !== 'id') {
        result[key] = data[key]
      }
    })
    return result as Omit<T, 'id'>
  }

  return data
}

export const omitIdInResponse: MiddlewareHandler = async (c, next) => {
  await next()

  const contentType = c.res.headers.get('content-type') || ''
  if (c.res.body && typeof c.res.body === 'object' && contentType.includes('application/json')) {
    const originalBody = await c.res.json<Record<string, any>>()
    const modifiedBody = omitId(originalBody)
    c.res = new Response(JSON.stringify(modifiedBody), c.res)
  }
}
