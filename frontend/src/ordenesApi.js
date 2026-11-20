const API = import.meta.env.VITE_API_URL

export async function consulta(path, method = 'GET', body) {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            ...(body !== undefined
                ? { 'Content-Type': 'application/json' }
                : {})
        },
        ...(body !== undefined
            ? { body: JSON.stringify(body) }
            : {})
    })

    const raw = await res.text()
    let datos

    try {
        datos = JSON.parse(raw)
    } catch {
        datos = raw
    }

    if (
        res.status === 401 ||
        (!res.ok && raw.includes('JWT expired'))
    ) {
        localStorage.removeItem('token')
        localStorage.removeItem('username')

        window.location.reload()

        throw new Error('Tu sesión ha expirado. Inicia sesión nuevamente.')
    }

    if (!res.ok) {
        throw new Error(
            typeof datos === 'object' && datos !== null
                ? datos.message || datos.error || `Error ${res.status}`
                : datos || `Error ${res.status}`
        )
    }

    return datos
}

export const listarOrdenes = () =>
    consulta('/api/ordenes')

export const obtenerOrden = id =>
    consulta(`/api/ordenes/${id}`)

export const crearOrden = body =>
    consulta('/api/ordenes', 'POST', body)

export const aprobarOrden = id =>
    consulta(`/api/ordenes/${id}/aprobar`, 'PUT')

export const rechazarOrden = (id, motivo) =>
    consulta(`/api/ordenes/${id}/rechazar`, 'PUT', { motivo })