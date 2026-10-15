import { ResponsiveContainer, Sankey, Tooltip } from 'recharts'
import type { SankeyData, SankeyLinkProps, SankeyNodeProps } from 'recharts'
import type { EstadoTurnoReporte, FlujoReservasProfesor } from '../../types/reporte'

interface ReservasProfesorSankeyProps {
  data: FlujoReservasProfesor[]
}

interface SankeyChartNode {
  name: string
  color: string
  kind: 'root' | 'profesor' | 'estado'
}

const ROOT_NODE: SankeyChartNode = {
  name: 'Reservas',
  color: '#0f766e',
  kind: 'root',
}

const ROOT_DESCRIPTION =
  'Reservas: representa el total de turnos registrados para el dia seleccionado, antes de ver con que profesor fueron tomados y en que estado terminaron.'

const ESTADO_ORDER: EstadoTurnoReporte[] = ['EnCurso', 'Finalizado', 'Cancelado', 'Vencido']

const ESTADO_LABELS: Record<EstadoTurnoReporte, string> = {
  EnCurso: 'En curso',
  Finalizado: 'Finalizado',
  Cancelado: 'Cancelado',
  Vencido: 'Vencido',
}

const ESTADO_COLORS: Record<EstadoTurnoReporte, string> = {
  EnCurso: '#2563eb',
  Finalizado: '#0f766e',
  Cancelado: '#dc2626',
  Vencido: '#d97706',
}

const ESTADO_DESCRIPTIONS: Record<EstadoTurnoReporte, string> = {
  EnCurso:
    'En curso: el turno sigue activo. La reserva existe y todavia esta pendiente de que el socio asista o de que se registre su ingreso.',
  Cancelado:
    'Cancelado: el turno fue anulado antes de realizarse, asi que ya no se esperaba la asistencia del socio y se libera el cupo.',
  Finalizado:
    'Finalizado: el turno se concreto correctamente. El socio asistio y el sistema lo tomo como completado.',
  Vencido:
    'Vencido: el turno quedo atras en el tiempo sin haberse completado. O sea, la fecha paso y ese turno ya no se uso.',
}

const PROFESSOR_COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#64748b']

function formatCount(value: number) {
  return value.toLocaleString('es-AR')
}

function isEstadoTurno(value: string): value is EstadoTurnoReporte {
  return ESTADO_ORDER.includes(value as EstadoTurnoReporte)
}

function buildSankeyData(items: FlujoReservasProfesor[]) {
  const profesores = new Map<
    number,
    {
      idUsuarioResponsable: number
      profesor: string
      total: number
      estados: Map<EstadoTurnoReporte, number>
    }
  >()

  items.forEach((item) => {
    if (!isEstadoTurno(item.estadoTurno) || item.cantidad <= 0) return

    const current = profesores.get(item.idUsuarioResponsable) ?? {
      idUsuarioResponsable: item.idUsuarioResponsable,
      profesor: item.profesor || `Profesor ${item.idUsuarioResponsable}`,
      total: 0,
      estados: new Map<EstadoTurnoReporte, number>(),
    }

    current.total += item.cantidad
    current.estados.set(item.estadoTurno, (current.estados.get(item.estadoTurno) ?? 0) + item.cantidad)
    profesores.set(item.idUsuarioResponsable, current)
  })

  const profesoresOrdenados = [...profesores.values()].sort((left, right) => {
    if (right.total !== left.total) return right.total - left.total
    return left.profesor.localeCompare(right.profesor, 'es-AR')
  })
  const estadosPresentes = ESTADO_ORDER.filter((estado) =>
    profesoresOrdenados.some((profesor) => (profesor.estados.get(estado) ?? 0) > 0),
  )
  const nodes: SankeyChartNode[] = [ROOT_NODE]
  const links: SankeyData['links'] = []
  const nodeIndex = new Map<string, number>([['root', 0]])

  profesoresOrdenados.forEach((profesor, index) => {
    const key = `profesor:${profesor.idUsuarioResponsable}`
    nodeIndex.set(key, nodes.length)
    nodes.push({
      name: profesor.profesor,
      color: PROFESSOR_COLORS[index % PROFESSOR_COLORS.length],
      kind: 'profesor',
    })
  })

  estadosPresentes.forEach((estado) => {
    const key = `estado:${estado}`
    nodeIndex.set(key, nodes.length)
    nodes.push({
      name: ESTADO_LABELS[estado],
      color: ESTADO_COLORS[estado],
      kind: 'estado',
    })
  })

  profesoresOrdenados.forEach((profesor) => {
    const profesorIndex = nodeIndex.get(`profesor:${profesor.idUsuarioResponsable}`)

    if (profesorIndex === undefined) return

    links.push({
      source: 0,
      target: profesorIndex,
      value: profesor.total,
    })

    ESTADO_ORDER.forEach((estado) => {
      const cantidad = profesor.estados.get(estado) ?? 0
      const estadoIndex = nodeIndex.get(`estado:${estado}`)

      if (cantidad > 0 && estadoIndex !== undefined) {
        links.push({
          source: profesorIndex,
          target: estadoIndex,
          value: cantidad,
        })
      }
    })
  })

  return {
    chartData: { nodes, links },
    totalReservas: profesoresOrdenados.reduce((total, profesor) => total + profesor.total, 0),
  }
}

function renderNode(props: SankeyNodeProps) {
  const payload = props.payload as unknown as SankeyChartNode
  const isRoot = payload.kind === 'root'
  const isProfesor = payload.kind === 'profesor'
  const isEstado = payload.kind === 'estado'
  const estadoKey = isEstado
    ? ESTADO_ORDER.find((estado) => ESTADO_LABELS[estado] === payload.name) ?? null
    : null
  const labelX = isProfesor ? props.x + props.width / 2 : isEstado ? props.x - 10 : props.x + props.width + 10
  const labelY = isProfesor ? props.y - 8 : props.y + props.height / 2
  const textAnchor = isProfesor ? 'middle' : isEstado ? 'end' : 'start'
  const fontSize = isProfesor ? 11 : 12
  const titleText = isRoot
    ? ROOT_DESCRIPTION
    : estadoKey
      ? ESTADO_DESCRIPTIONS[estadoKey]
      : `${payload.name}: ${formatCount(Number(props.payload.value ?? 0))}`

  return (
    <g>
      <rect
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        rx={4}
        fill={payload.color}
        opacity={0.94}
      />
      <text
        className="reportes-sankey-node-label"
        x={labelX}
        y={labelY}
        fontSize={fontSize}
        fontWeight={800}
        dominantBaseline={isProfesor ? 'auto' : 'middle'}
        textAnchor={textAnchor}
      >
        {payload.name}
      </text>
      <title>{titleText}</title>
    </g>
  )
}

function renderLink(props: SankeyLinkProps) {
  const source = props.payload.source as unknown as SankeyChartNode
  const target = props.payload.target as unknown as SankeyChartNode
  const stroke = target.kind === 'estado' ? target.color : source.color
  const labelX = (props.sourceX + props.targetX) / 2
  const labelY = (props.sourceY + props.targetY) / 2
  const labelFontSize = Math.max(10, Math.min(12, props.linkWidth * 0.55))
  const path = `
    M${props.sourceX},${props.sourceY}
    C${props.sourceControlX},${props.sourceY}
     ${props.targetControlX},${props.targetY}
     ${props.targetX},${props.targetY}
  `

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeOpacity={0.24}
        strokeWidth={Math.max(1, props.linkWidth)}
      />
      <text
        className="reportes-sankey-link-label"
        x={labelX}
        y={labelY}
        fontSize={labelFontSize}
        fontWeight={800}
        dominantBaseline="middle"
        textAnchor="middle"
        paintOrder="stroke"
        strokeWidth={3}
        strokeOpacity={0.92}
      >
        {formatCount(Number(props.payload.value ?? 0))}
      </text>
    </g>
  )
}

export function ReservasProfesorSankey({ data }: ReservasProfesorSankeyProps) {
  const { chartData, totalReservas } = buildSankeyData(data)

  if (chartData.links.length === 0) {
    return (
      <section
        className="reportes-sankey reportes-surface reportes-sankey--empty"
        aria-label="Flujo de reservas por profesor"
      >
        <p className="inicio-status">No hay reservas por profesor para graficar en este dia.</p>
      </section>
    )
  }

  return (
    <section className="reportes-sankey reportes-surface" aria-label="Flujo de reservas por profesor">
      <header className="reportes-sankey__header">
        <div>
          <span className="section-kicker">Flujo operativo</span>
          <h3>Reservas por profesor y resultado</h3>
        </div>
        <strong>{formatCount(totalReservas)} reservas</strong>
      </header>

      <div className="reportes-sankey__chart">
        <ResponsiveContainer width="100%" height={340}>
          <Sankey
            data={chartData}
            dataKey="value"
            nameKey="name"
            node={renderNode}
            link={renderLink}
            nodePadding={22}
            nodeWidth={14}
            iterations={40}
            margin={{ top: 28, right: 120, bottom: 18, left: 120 }}
            sort={false}
            verticalAlign="top"
          >
            <Tooltip
              formatter={(value) => [formatCount(Number(value)), 'Turnos']}
              labelFormatter={(label) => String(label)}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
