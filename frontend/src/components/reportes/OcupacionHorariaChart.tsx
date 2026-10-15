import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { OcupacionHoraria } from '../../types/reporte'

interface OcupacionHorariaChartProps {
  data: OcupacionHoraria[]
}

const DEMANDA_COLORS: Record<string, string> = {
  Alta: '#dc2626',
  Media: '#2563eb',
  Baja: '#d97706',
  'Sin uso': '#94a3b8',
  'Sin cupo': '#64748b',
}

function getLabel(item: OcupacionHoraria) {
  const hour = item.rangoHorario.split(' - ')[0] ?? item.rangoHorario
  return hour
}

export function OcupacionHorariaChart({ data }: OcupacionHorariaChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    label: getLabel(item),
  }))

  if (chartData.length === 0) {
    return (
      <div className="reportes-chart reportes-chart--empty">
        <p className="inicio-status">No hay ocupacion horaria para graficar en este periodo.</p>
      </div>
    )
  }

  return (
    <div className="reportes-chart reportes-surface">
      <div className="reportes-block-heading">
        <span className="section-kicker">Grafico</span>
        <h3>Ocupacion por franja horaria</h3>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 12, right: 16, bottom: 42, left: 18 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" angle={-35} textAnchor="end" interval={0} height={64}>
            <Label
              value="Horario"
              position="insideBottom"
              offset={-8}
              fill="#64748b"
              fontSize={12}
              fontWeight={800}
            />
          </XAxis>
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} width={64}>
            <Label
              value="Ocupacion"
              angle={-90}
              position="left"
              fill="#64748b"
              fontSize={12}
              fontWeight={800}
              offset={2}
            />
          </YAxis>
          <Tooltip
            formatter={(value, name) => {
              if (name === 'porcentajeOcupacion') {
                return [`${Number(value).toFixed(2)}%`, 'Ocupacion']
              }

              return [value, name]
            }}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload as OcupacionHoraria | undefined
              return item ? `${item.dia} ${item.rangoHorario}` : ''
            }}
          />
          <Bar dataKey="porcentajeOcupacion" radius={[6, 6, 0, 0]}>
            {chartData.map((item) => (
              <Cell
                key={`${item.dia}-${item.rangoHorario}`}
                fill={DEMANDA_COLORS[item.nivelDemanda] ?? '#0f766e'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
