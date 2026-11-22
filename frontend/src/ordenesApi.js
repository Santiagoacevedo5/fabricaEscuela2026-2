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

export const enviarOrden = id =>
    consulta(`/api/ordenes/${id}/enviar`, 'PUT')

// ---------- HU7.3: Mis órdenes (encargado de tienda) ----------
export const misOrdenes = () =>
    consulta('/api/mis-ordenes')

export const detalleMiOrden = id =>
    consulta(`/api/mis-ordenes/${id}`)

export const confirmarRecepcion = id =>
    consulta(`/api/mis-ordenes/${id}/recepcion`, 'POST')

// ---------- HU8.2: Reporte de niveles de inventario (admin) ----------
export const ubicacionesReporte = () =>
    consulta('/api/reportes/ubicaciones')

export const reporteInventario = (tipo, ubicacionId) =>
    consulta(
        tipo && ubicacionId
            ? `/api/reportes/inventario?tipo=${tipo}&ubicacionId=${ubicacionId}`
            : '/api/reportes/inventario'
    )
