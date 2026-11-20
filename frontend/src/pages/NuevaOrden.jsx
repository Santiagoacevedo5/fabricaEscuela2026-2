import { useEffect, useState, useRef } from 'react'
import { consulta, listarOrdenes, crearOrden } from '../ordenesApi'

const boton = 'rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'

const campo = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700'

export default function NuevaOrden({ usuario, esAdmin }) {

    const [tiendas, setTiendas] = useState([])
    const [ordenes, setOrdenes] = useState([])
    const [inventario, setInventario] = useState([])
    const [tiendaId, setTiendaId] = useState('')

    const [filas, setFilas] = useState([
        { key: 0, productoId: '', cantidad: '' }
    ])

    const [error, setError] = useState('')
    const [exito, setExito] = useState('')
    const [cargando, setCargando] = useState(true)
    const [cargandoStock, setCargandoStock] = useState(false)
    const [guardando, setGuardando] = useState(false)

    const secuencia = useRef(1)

    // Cargar tiendas, centros y órdenes existentes
    useEffect(() => {
        let vigente = true

        Promise.all([
            consulta('/api/tiendas'),
            consulta('/api/centros'),
            listarOrdenes()
        ])
            .then(([ts, cs, os]) => {
                if (!vigente) return

                const ids = new Set(
                    cs.filter(c =>
                        esAdmin ||
                        c.encargado?.username === usuario.nombre
                    ).map(c => c.id)
                )

                setTiendas(
                    ts.filter(t =>
                        t.activa !== false &&
                        ids.has(t.centroDistribucion?.id)
                    )
                )

                setOrdenes(os)
            })
            .catch(e => {
                if (vigente) setError(e.message)
            })
            .finally(() => {
                if (vigente) setCargando(false)
            })

        return () => { vigente = false }

    }, [usuario.nombre, esAdmin])

    const tienda = tiendas.find(
        t => String(t.id) === tiendaId
    )

    const centroId = tienda?.centroDistribucion?.id

    // Cargar el inventario del CD correspondiente
    useEffect(() => {
        let vigente = true

        if (centroId == null) return

        consulta(`/api/inventario-cd/${centroId}`)
            .then(datos => {
                if (vigente) setInventario(datos)
            })
            .catch(e => {
                if (vigente) setError(e.message)
            })
            .finally(() => {
                if (vigente) setCargandoStock(false)
            })

        return () => { vigente = false }

    }, [centroId])

    const cambiarTienda = id => {

        const nuevoCentro = tiendas.find(
            t => String(t.id) === id
        )?.centroDistribucion?.id

        if (nuevoCentro !== centroId) {
            setInventario([])
            setCargandoStock(nuevoCentro != null)
        }

        setTiendaId(id)

        setFilas([
            {
                key: secuencia.current++,
                productoId: '',
                cantidad: ''
            }
        ])

        setError('')
        setExito('')
    }

    const productos = inventario.filter(
        i => i.producto?.activo
    )

    // Calcular stock disponible descontando las reservas
    const disponible = id => {

        const fisico = productos.find(
            i => String(i.producto.idProducto) === String(id)
        )?.cantidad ?? 0

        const reservado = ordenes
            .filter(o =>
                o.centroId === centroId &&
                ['Pendiente', 'Aprobada'].includes(o.estado)
            )
            .flatMap(o => o.items || [])
            .filter(i =>
                String(i.productoId) === String(id)
            )
            .reduce((a, i) => a + i.cantidad, 0)

        return Math.max(0, fisico - reservado)
    }

    const actualizar = (key, cambio) => {

        setFilas(prev =>
            prev.map(f =>
                f.key === key ? { ...f, ...cambio } : f
            )
        )

        setError('')
        setExito('')
    }

    // Crear orden manual
    const confirmar = async e => {

        e.preventDefault()
        setError('')
        setExito('')

        if (!tiendaId) {
            return setError('Debes seleccionar una tienda.')
        }

        const seleccionadas = filas.filter(
            f => f.productoId || f.cantidad !== ''
        )

        if (!seleccionadas.length) {
            return setError(
                'Agrega al menos un producto antes de confirmar la orden.'
            )
        }

        if (seleccionadas.some(f =>
            !f.productoId ||
            !Number.isSafeInteger(Number(f.cantidad)) ||
            Number(f.cantidad) <= 0
        )) {
            return setError(
                'Selecciona un producto y una cantidad entera mayor que cero en cada línea.'
            )
        }

        if (new Set(
            seleccionadas.map(f => f.productoId)
        ).size !== seleccionadas.length) {
            return setError('Hay un producto repetido en la orden.')
        }

        if (seleccionadas.some(f =>
            Number(f.cantidad) > disponible(f.productoId)
        )) {
            return setError('La cantidad supera el stock disponible.')
        }

        setGuardando(true)

        try {

            const o = await crearOrden({
                tiendaId: Number(tiendaId),
                items: seleccionadas.map(f => ({
                    productoId: Number(f.productoId),
                    cantidad: Number(f.cantidad)
                }))
            })

            setExito(
                `Orden #${o.id} creada correctamente en estado Pendiente.`
            )

            setTiendaId('')
            setInventario([])

            setFilas([
                {
                    key: secuencia.current++,
                    productoId: '',
                    cantidad: ''
                }
            ])

            try {
                setOrdenes(await listarOrdenes())
            } catch {
                setError(
                    'Orden creada. No se pudo actualizar el stock reservado; recarga la página.'
                )
                setTiendas([])
            }

        } catch (e) {

            setError(e.message)

            try {
                setOrdenes(await listarOrdenes())
                setInventario(
                    await consulta(`/api/inventario-cd/${centroId}`)
                )
            } catch {
                // Mantener mensaje original
            }

        } finally {
            setGuardando(false)
        }
    }

    return (
        <div className="p-6 md:p-8">
            <div className="mx-auto max-w-7xl">

                <h1 className="text-2xl font-bold text-slate-900">
                    Nueva orden
                </h1>

                <p className="mb-6 mt-1 text-sm text-slate-500">
                    Crea una orden manual de reabastecimiento desde tu centro de distribución
                </p>

                {exito && (
                    <p role="status"
                       className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                        ✓ {exito}
                    </p>
                )}

                {cargando ? (
                    <p>Cargando tiendas...</p>
                ) : (

                    <form noValidate
                          onSubmit={confirmar}
                          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                        {/* Selección de tienda */}

                        <div className="p-6 border-b border-slate-200">

                            <label htmlFor="orden-tienda"
                                   className="block text-sm font-medium text-slate-700 mb-2">
                                Tienda de destino
                            </label>

                            <select
                                id="orden-tienda"
                                value={tiendaId}
                                disabled={guardando}
                                onChange={e => cambiarTienda(e.target.value)}
                                className={`${campo} max-w-xl`}>

                                <option value="">
                                    Selecciona una tienda
                                </option>

                                {tiendas.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.nombre} · {t.region}
                                    </option>
                                ))}

                            </select>

                            {esAdmin && tienda && (
                                <p className="mt-2 text-xs text-slate-500">
                                    CD: {tienda.centroDistribucion.nombre}
                                </p>
                            )}

                        </div>

                        {/* Productos de la orden */}

                        <div className="p-6 space-y-3">

                            <div className="flex flex-wrap justify-between gap-3">

                                <div>
                                    <h2 className="text-sm font-semibold">
                                        Productos de la orden
                                    </h2>

                                    <p className="text-xs text-slate-500">
                                        Stock disponible del CD, descontando reservas.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    disabled={guardando}
                                    className={boton}
                                    onClick={() => setFilas(p => [
                                        ...p,
                                        {
                                            key: secuencia.current++,
                                            productoId: '',
                                            cantidad: ''
                                        }
                                    ])}>

                                    ＋ Agregar producto

                                </button>

                            </div>

                            {filas.map((f, i) => {

                                const exceso =
                                    f.productoId &&
                                    Number(f.cantidad) > disponible(f.productoId)

                                return (

                                    <div
                                        key={f.key}
                                        className={`rounded-xl border p-4 ${
                                            exceso
                                                ? 'border-red-300 bg-red-50'
                                                : 'border-slate-200 bg-slate-50'
                                        }`}>

                                        <div className="flex flex-wrap items-end gap-3">

                                            <label className="flex-1 min-w-[180px] text-xs text-slate-600">

                                                Producto {i + 1}

                                                <select
                                                    disabled={guardando || !tiendaId || cargandoStock}
                                                    className={`${campo} mt-1 ${exceso ? 'border-red-400' : ''}`}
                                                    value={f.productoId}
                                                    onChange={e => actualizar(
                                                        f.key,
                                                        { productoId: e.target.value }
                                                    )}>

                                                    <option value="">
                                                        Selecciona un producto
                                                    </option>

                                                    {productos.map(p => (
                                                        <option
                                                            key={p.producto.idProducto}
                                                            value={p.producto.idProducto}>

                                                            {p.producto.nombre} · {p.producto.identificador}

                                                        </option>
                                                    ))}

                                                </select>

                                            </label>

                                            <label className="w-40 text-xs text-slate-600">

                                                Cantidad

                                                <input
                                                    disabled={guardando}
                                                    className={`${campo} mt-1 ${exceso ? 'border-red-400' : ''}`}
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    placeholder="0"
                                                    value={f.cantidad}
                                                    onChange={e => actualizar(
                                                        f.key,
                                                        { cantidad: e.target.value }
                                                    )}
                                                />

                                            </label>

                                            <button
                                                type="button"
                                                aria-label={`Eliminar producto ${i + 1}`}
                                                disabled={guardando}
                                                className="px-3 py-2 text-slate-500 hover:text-red-600"
                                                onClick={() => setFilas(
                                                    p => p.filter(x => x.key !== f.key)
                                                )}>

                                                ✕

                                            </button>

                                        </div>

                                        {f.productoId && (
                                            <p className="mt-2 text-xs text-slate-500">
                                                Stock disponible en el CD:
                                                {' '}
                                                <b>{disponible(f.productoId)} unidades</b>
                                            </p>
                                        )}

                                        {exceso && (
                                            <p className="mt-2 text-xs text-red-600">
                                                La cantidad supera el stock. Stock disponible:
                                                {' '}
                                                {disponible(f.productoId)} unidades.
                                            </p>
                                        )}

                                    </div>
                                )
                            })}

                            {cargandoStock && (
                                <p className="text-sm text-slate-500">
                                    Cargando inventario...
                                </p>
                            )}

                            {error && (
                                <p role="alert"
                                   className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">

                                    {error}

                                </p>
                            )}

                        </div>

                        <div className="flex justify-end border-t border-slate-200 bg-slate-50 p-4">

                            <button
                                disabled={guardando || cargandoStock}
                                className={boton}>

                                {guardando ? 'Guardando...' : 'Confirmar'}

                            </button>

                        </div>

                    </form>
                )}

            </div>
        </div>
    )
}