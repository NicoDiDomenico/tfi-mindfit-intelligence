import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BackToGymLink } from "../components/BackToHomeLink";
import { OcupacionHorariaChart } from "../components/reportes/OcupacionHorariaChart";
import { ReservasProfesorSankey } from "../components/reportes/ReservasProfesorSankey";
import { useAuth } from "../hooks/useAuth";
import { AppLayout } from "../layouts/AppLayout";
import { reportesService } from "../services/reportesService";
import type {
  CuotaSocio,
  OcupacionHoraria,
  ReportesGimnasio,
  SocioRiesgo,
} from "../types/reporte";
import { getApiErrorMessage } from "../utils/apiError";

const VER_REPORTES_GIMNASIO = "VER_REPORTES_GIMNASIO";
const PDF_LIGHT_BACKGROUND = "#ffffff";

interface FilterState {
  semana: string;
}

type ActiveReport = "ocupacion" | "retencion";

const CUOTA_STATUS_COLORS: Record<string, string> = {
  Vigente: "#0f766e",
  Vencida: "#dc2626",
};

const WEEK_DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getIsoWeekYear(date: Date) {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  return target.getUTCFullYear();
}

function getIsoWeekNumber(date: Date) {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
}

function toInputWeek(date: Date) {
  const year = getIsoWeekYear(date);
  const week = getIsoWeekNumber(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function getDateRangeFromWeek(weekValue: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekValue);

  if (!match) {
    return getDateRangeFromWeek(toInputWeek(new Date()));
  }

  const year = Number(match[1]);
  const week = Number(match[2]);
  const fourthOfJanuary = new Date(Date.UTC(year, 0, 4));
  const fourthDay = fourthOfJanuary.getUTCDay() || 7;
  const monday = new Date(fourthOfJanuary);
  monday.setUTCDate(
    fourthOfJanuary.getUTCDate() - fourthDay + 1 + (week - 1) * 7,
  );

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    fechaDesde: toInputDate(monday),
    fechaHasta: toInputDate(sunday),
  };
}

function getDefaultFilters(): FilterState {
  return {
    semana: toInputWeek(new Date()),
  };
}

function getTodayName() {
  const dayIndex = new Date().getDay();
  return WEEK_DAYS[dayIndex === 0 ? 6 : dayIndex - 1];
}

function formatPercent(value: number) {
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function forceLightThemeForPdf(documentClone: Document) {
  documentClone
    .querySelectorAll<HTMLElement>(".workspace-shell[data-theme]")
    .forEach((element) => {
      element.dataset.theme = "light";
    });
}

function formatDate(value: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
  }).format(parsed);
}

function parseReportDate(value: string | null) {
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDaysDiff(from: Date, to: Date) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((end.getTime() - start.getTime()) / 86400000);
}

function getCuotaStatus(value: string) {
  return value || "Sin estado";
}

function formatInputDate(value: string) {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value || "-";

  return `${day}/${month}/${year}`;
}

function formatWeekRange(value: string) {
  const range = getDateRangeFromWeek(value);
  return `${formatInputDate(range.fechaDesde)} al ${formatInputDate(range.fechaHasta)}`;
}

function getDemandBadgeClass(value: string) {
  return `reportes-badge reportes-badge--demand-${value.toLocaleLowerCase("es-AR").replaceAll(" ", "-")}`;
}

function getRiskBadgeClass(value: string) {
  return `reportes-badge reportes-badge--risk-${value.toLocaleLowerCase("es-AR")}`;
}

function getRiskRowClass(value: string) {
  return `reportes-table-row--selected reportes-table-row--risk-${value.toLocaleLowerCase("es-AR")}`;
}

function getRiskRadioClass(value: string) {
  return `reportes-risk-radio reportes-risk-radio--${value.toLocaleLowerCase("es-AR")}`;
}

function getDaysWithoutAttendance(value: number | null) {
  if (value === null || value === undefined) {
    return "Sin asistencia";
  }

  return `${value} dias`;
}

interface MontoAcumuladoLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  value?: number | string | boolean | null;
}

function renderMontoAcumuladoLabel({
  x,
  y,
  width,
  value,
}: MontoAcumuladoLabelProps) {
  if (value === false) {
    return <g />;
  }

  const label = String(value ?? "");
  const labelX = Number(x ?? 0);
  const labelY = Number(y ?? 0);
  const labelWidth = Number(width ?? 0);

  if (
    !label ||
    Number.isNaN(labelX) ||
    Number.isNaN(labelY) ||
    Number.isNaN(labelWidth)
  ) {
    return <g />;
  }

  const rectWidth = Math.max(label.length * 6.4 + 16, 54);
  const rectHeight = 20;
  const rectX = Math.max(labelX + labelWidth / 2 - rectWidth / 2, 0);
  const rectY = Math.max(labelY - rectHeight - 7, 0);

  return (
    <g>
      <rect
        className="reportes-cuotas-label-bg"
        x={rectX}
        y={rectY}
        width={rectWidth}
        height={rectHeight}
        rx={10}
      />
      <text
        className="reportes-cuotas-label-text"
        x={rectX + rectWidth / 2}
        y={rectY + 13.5}
        fontSize={11}
        fontWeight={800}
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );
}

function OcupacionTable({ items }: { items: OcupacionHoraria[] }) {
  if (items.length === 0) {
    return (
      <p className="inicio-status">
        No hay datos de ocupacion para el periodo seleccionado.
      </p>
    );
  }

  return (
    <div className="reportes-surface">
      <div className="reportes-block-heading">
        <span className="section-kicker">Tabla</span>
        <h3>Detalle de ocupacion por horario</h3>
      </div>
      <div className="reportes-table-wrap">
        <table className="reportes-table">
          <thead>
            <tr>
              <th
                className="reportes-table__help"
                data-tooltip="Rango horario configurado para el dia seleccionado."
              >
                Horario
              </th>
              <th
                className="reportes-table__help"
                data-tooltip="Cantidad maxima de socios que pueden reservar en ese horario."
              >
                Cupo
              </th>
              <th
                className="reportes-table__help"
                data-tooltip="Cantidad total de turnos registrados para ese horario, incluyendo cancelados."
              >
                Reservas
              </th>
              <th
                className="reportes-table__help"
                data-tooltip="Porcentaje de uso del cupo. Se calcula con turnos no cancelados sobre el cupo maximo."
              >
                Ocupacion
              </th>
              <th
                className="reportes-table__help"
                data-tooltip="Clasificacion del horario segun su porcentaje de ocupacion."
              >
                Demanda
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.dia}-${item.rangoHorario}`}>
                <td data-label="Horario">{item.rangoHorario}</td>
                <td data-label="Cupo">{item.cupoMaximo}</td>
                <td data-label="Reservas">{item.reservas}</td>
                <td data-label="Ocupacion">
                  {formatPercent(item.porcentajeOcupacion)}
                </td>
                <td data-label="Demanda">
                  <span className={getDemandBadgeClass(item.nivelDemanda)}>
                    {item.nivelDemanda}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface SociosRiesgoTableProps {
  items: SocioRiesgo[];
  selectedId: number | null;
  onSelect: (idUsuarioSocio: number) => void;
}

function SociosRiesgoTable({
  items,
  selectedId,
  onSelect,
}: SociosRiesgoTableProps) {
  if (items.length === 0) {
    return (
      <p className="inicio-status">
        No se detectaron socios para el periodo seleccionado.
      </p>
    );
  }

  return (
    <div className="reportes-table-wrap">
      <table className="reportes-table reportes-table--risk">
        <thead>
          <tr>
            <th aria-label="Seleccionar socio" />
            <th
              className="reportes-table__help"
              data-tooltip="Socio incluido en el seguimiento del periodo, con su estado actual."
            >
              Socio
            </th>
            <th
              className="reportes-table__help"
              data-tooltip="Nivel estimado de riesgo de baja o inactividad segun el reporte."
            >
              Riesgo
            </th>
            <th
              className="reportes-table__help"
              data-tooltip="Estado de la ultima cuota registrada y su fecha de vencimiento."
            >
              Cuota
            </th>
            <th
              className="reportes-table__help"
              data-tooltip="Fecha del ultimo turno asistido y tiempo transcurrido sin asistencia."
            >
              Ultimo turno
            </th>
            <th
              className="reportes-table__help"
              data-tooltip="Cantidad de rutinas activas asociadas al socio."
            >
              Rutinas
            </th>
            <th
              className="reportes-table__help"
              data-tooltip="Accion sugerida para el seguimiento comercial del socio."
            >
              Recomendacion
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.idUsuarioSocio}
              className={
                selectedId === item.idUsuarioSocio
                  ? getRiskRowClass(item.nivelRiesgo)
                  : undefined
              }
              onClick={() => onSelect(item.idUsuarioSocio)}
            >
              <td data-label="">
                <label
                  className={getRiskRadioClass(item.nivelRiesgo)}
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    type="radio"
                    name="socio-riesgo-seleccionado"
                    checked={selectedId === item.idUsuarioSocio}
                    onChange={() => onSelect(item.idUsuarioSocio)}
                    aria-label={`Seleccionar ${item.nombreCompleto || `Socio ${item.idUsuarioSocio}`}`}
                  />
                  <span aria-hidden="true" />
                </label>
              </td>
              <td data-label="Socio">
                <strong>
                  {item.nombreCompleto || `Socio ${item.idUsuarioSocio}`}
                </strong>
                <span>Estado: {item.estadoSocio}</span>
              </td>
              <td data-label="Riesgo">
                <span className={getRiskBadgeClass(item.nivelRiesgo)}>
                  {item.nivelRiesgo}
                </span>
              </td>
              <td data-label="Cuota">
                {item.estadoUltimaCuota ?? "Sin cuota"}
                <small>Fin: {formatDate(item.fechaFinUltimaCuota)}</small>
              </td>
              <td data-label="Ultimo turno">
                {formatDate(item.ultimoTurno)}
                <small>{getDaysWithoutAttendance(item.diasSinAsistir)}</small>
              </td>
              <td data-label="Rutinas">{item.rutinasActivas}</td>
              <td data-label="Recomendacion">{item.recomendacion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SocioCuotasPanelProps {
  socio: SocioRiesgo | null;
  cuotas: CuotaSocio[];
  isLoading: boolean;
  error: string;
}

function SocioCuotasPanel({
  socio,
  cuotas,
  isLoading,
  error,
}: SocioCuotasPanelProps) {
  const cuotasOrdenadas = [...cuotas].sort((left, right) => {
    const leftDate = parseReportDate(left.fechaInicioPeriodo)?.getTime() ?? 0;
    const rightDate = parseReportDate(right.fechaInicioPeriodo)?.getTime() ?? 0;
    return leftDate - rightDate;
  });
  const ultimaCuota = [...cuotas].sort((left, right) => {
    const leftDate = parseReportDate(left.fechaFinPeriodo)?.getTime() ?? 0;
    const rightDate = parseReportDate(right.fechaFinPeriodo)?.getTime() ?? 0;
    return rightDate - leftDate;
  })[0];
  const montoTotal = cuotas.reduce((total, cuota) => total + cuota.monto, 0);
  const cuotasVencidas = cuotas.filter(
    (cuota) => getCuotaStatus(cuota.estadoCuota) === "Vencida",
  ).length;
  const cuotasVigentes = cuotas.filter(
    (cuota) => getCuotaStatus(cuota.estadoCuota) === "Vigente",
  ).length;
  const vencimientoUltimaCuota = parseReportDate(
    ultimaCuota?.fechaFinPeriodo ?? null,
  );
  const diasVencimiento = vencimientoUltimaCuota
    ? getDaysDiff(vencimientoUltimaCuota, new Date())
    : null;
  const estadoData = Object.entries(
    cuotas.reduce<Record<string, number>>((accumulator, cuota) => {
      const estado = getCuotaStatus(cuota.estadoCuota);
      accumulator[estado] = (accumulator[estado] ?? 0) + 1;
      return accumulator;
    }, {}),
  ).map(([estado, cantidad]) => ({ estado, cantidad }));
  const totalEstadosCuota = estadoData.reduce(
    (total, item) => total + item.cantidad,
    0,
  );
  let montoAcumulado = 0;
  const montoData = cuotasOrdenadas.map((cuota, index) => {
    montoAcumulado += cuota.monto;

    return {
      label: `Cuota ${index + 1}`,
      periodo: `${formatDate(cuota.fechaInicioPeriodo)} - ${formatDate(cuota.fechaFinPeriodo)}`,
      monto: cuota.monto,
      montoAcumulado,
      estado: getCuotaStatus(cuota.estadoCuota),
      plan: cuota.plan,
      labelDetalle: formatCurrency(montoAcumulado),
    };
  });
  const cuotasTimelineFechas = cuotasOrdenadas
    .map((cuota, index) => {
      const fechaInicio = parseReportDate(cuota.fechaInicioPeriodo);
      const fechaFin = parseReportDate(cuota.fechaFinPeriodo);

      if (!fechaInicio || !fechaFin) return null;

      return {
        cuota,
        index,
        fechaInicio,
        fechaFin,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const timelineInicio = cuotasTimelineFechas.reduce<Date | null>(
    (current, item) =>
      current === null || item.fechaInicio < current
        ? item.fechaInicio
        : current,
    null,
  );
  const timelineFin = cuotasTimelineFechas.reduce<Date | null>(
    (current, item) =>
      current === null || item.fechaFin > current ? item.fechaFin : current,
    null,
  );
  const timelineDias =
    timelineInicio && timelineFin
      ? Math.max(getDaysDiff(timelineInicio, timelineFin), 1)
      : 1;
  const timelineData =
    timelineInicio && timelineFin
      ? cuotasTimelineFechas.map((item) => {
          const inicioPercent = Math.max(
            (getDaysDiff(timelineInicio, item.fechaInicio) / timelineDias) *
              100,
            0,
          );
          const duracionPercent = Math.max(
            (Math.max(getDaysDiff(item.fechaInicio, item.fechaFin), 1) /
              timelineDias) *
              100,
            3,
          );
          const anchoPercent = Math.min(duracionPercent, 100 - inicioPercent);

          return {
            ...item,
            inicioPercent,
            anchoPercent,
            finPercent: inicioPercent + anchoPercent,
            estado: getCuotaStatus(item.cuota.estadoCuota),
            etiquetaLateral: `${item.cuota.plan} - ${formatCurrency(item.cuota.monto)}`,
            fechaFinLabel: formatDate(item.cuota.fechaFinPeriodo),
            axisLabelAlign:
              inicioPercent + anchoPercent >= 96
                ? "end"
                : inicioPercent + anchoPercent <= 4
                  ? "start"
                  : "center",
          };
        })
      : [];
  const timelineGuidePercents = Array.from(
    new Set(timelineData.map((item) => item.finPercent.toFixed(4))),
  )
    .map((value) => Number(value))
    .sort((left, right) => left - right);
  const estadoActualTexto =
    diasVencimiento === null
      ? "Sin vencimiento"
      : diasVencimiento > 0
        ? `Vencida hace ${diasVencimiento} dias`
        : `Vence en ${Math.abs(diasVencimiento)} dias`;

  if (!socio) {
    return (
      <div className="reportes-cuotas-panel reportes-surface">
        <p className="inicio-status">
          Selecciona un socio para ver el historial de cuotas.
        </p>
      </div>
    );
  }

  return (
    <section
      className="reportes-cuotas-panel reportes-surface"
      aria-label="Graficos de cuotas del socio"
    >
      <div className="reportes-block-heading">
        <span className="section-kicker">Cuotas del socio seleccionado</span>
        <h3>{socio.nombreCompleto || `Socio ${socio.idUsuarioSocio}`}</h3>
      </div>

      {isLoading ? (
        <p className="inicio-status">Cargando historial de cuotas...</p>
      ) : null}
      {error ? (
        <p className="inicio-status inicio-status--error">{error}</p>
      ) : null}

      {!isLoading && !error && cuotas.length === 0 ? (
        <p className="inicio-status">
          No encontramos cuotas registradas para este socio.
        </p>
      ) : null}

      {!isLoading && !error && cuotas.length > 0 ? (
        <>
          <div className="reportes-cuotas-metrics">
            <article>
              <span>Estado actual</span>
              <strong>{estadoActualTexto}</strong>
              <small>
                {ultimaCuota
                  ? `Ultima cuota: ${getCuotaStatus(ultimaCuota.estadoCuota)}.`
                  : ""}
              </small>
            </article>
            <article>
              <span>Monto historico</span>
              <strong>{formatCurrency(montoTotal)}</strong>
              <small>Total registrado en las cuotas del socio.</small>
            </article>
            <article>
              <span>Historial</span>
              <strong>{cuotas.length}</strong>
              <small>
                {cuotasVigentes} vigentes, {cuotasVencidas} vencidas.
              </small>
            </article>
          </div>

          <div className="reportes-cuotas-grid">
            <div className="reportes-cuotas-chart">
              <div className="reportes-block-heading">
                <span className="section-kicker">Montos</span>
                <h3>Monto acumulado por cuota</h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={montoData}
                  margin={{ top: 12, right: 12, bottom: 36, left: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={58}
                  />
                  <YAxis
                    width={72}
                    tickFormatter={(value) => formatCurrency(Number(value))}
                  />
                  <Tooltip
                    formatter={(value, name, item) => {
                      const cuota = item.payload as (typeof montoData)[number];

                      if (name === "montoAcumulado") {
                        return [
                          `${formatCurrency(Number(value))} acumulado (${formatCurrency(cuota.monto)} cuota)`,
                          "Monto",
                        ];
                      }

                      return [formatCurrency(Number(value)), "Monto"];
                    }}
                    labelFormatter={(_, payload) => {
                      const item = payload?.[0]?.payload as
                        | (typeof montoData)[number]
                        | undefined;
                      return item ? `${item.periodo} - ${item.plan}` : "";
                    }}
                  />
                  <Bar dataKey="montoAcumulado" radius={[6, 6, 0, 0]}>
                    <LabelList
                      dataKey="labelDetalle"
                      position="top"
                      content={renderMontoAcumuladoLabel}
                    />
                    {montoData.map((item) => (
                      <Cell
                        key={`${item.periodo}-${item.estado}`}
                        fill={CUOTA_STATUS_COLORS[item.estado] ?? "#2563eb"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="reportes-cuotas-chart">
              <div className="reportes-block-heading">
                <span className="section-kicker">Estados</span>
                <h3>Estado de cuotas</h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart margin={{ top: 18, right: 20, bottom: 8, left: 20 }}>
                  <Pie
                    data={estadoData}
                    dataKey="cantidad"
                    nameKey="estado"
                    cx="50%"
                    cy="48%"
                    innerRadius={54}
                    outerRadius={78}
                    paddingAngle={3}
                    label={({ percent }) =>
                      `${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {estadoData.map((item) => (
                      <Cell
                        key={item.estado}
                        fill={CUOTA_STATUS_COLORS[item.estado] ?? "#64748b"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => {
                      const cantidad = Number(value);
                      const porcentaje =
                        totalEstadosCuota > 0
                          ? (cantidad / totalEstadosCuota) * 100
                          : 0;
                      return [
                        `${cantidad} cuotas (${porcentaje.toFixed(0)}%)`,
                        "Cantidad",
                      ];
                    }}
                  />
                  <Legend align="left" wrapperStyle={{ textAlign: "left" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {timelineData.length > 0 ? (
            <div className="reportes-cuotas-gantt">
              <div className="reportes-block-heading">
                <span className="section-kicker">Periodo</span>
                <h3>Inicio y fin de cada cuota</h3>
              </div>
              <div className="reportes-cuotas-gantt__axis" aria-hidden="true">
                <span className="reportes-cuotas-gantt__axis-spacer" />
                <div className="reportes-cuotas-gantt__axis-track">
                  <span className="reportes-cuotas-gantt__axis-start">
                    {formatDate(timelineInicio?.toISOString() ?? null)}
                  </span>
                  {timelineData.map((item) => (
                    <span
                      key={`axis-${item.cuota.idCuota}`}
                      className={`reportes-cuotas-gantt__axis-end reportes-cuotas-gantt__axis-end--${item.axisLabelAlign}`}
                      style={{ left: `${item.finPercent}%` }}
                    >
                      {item.fechaFinLabel}
                    </span>
                  ))}
                </div>
              </div>
              <div className="reportes-cuotas-gantt__rows">
                {timelineData.map((item) => (
                  <article
                    key={item.cuota.idCuota}
                    className="reportes-cuotas-gantt__row"
                  >
                    <div className="reportes-cuotas-gantt__meta">
                      <strong>Cuota {item.index + 1}</strong>
                      <small>{item.etiquetaLateral}</small>
                    </div>
                    <div className="reportes-cuotas-gantt__track">
                      {timelineGuidePercents.map((guidePercent) => (
                        <span
                          key={`guide-${item.cuota.idCuota}-${guidePercent}`}
                          className="reportes-cuotas-gantt__guide"
                          style={{ left: `${guidePercent}%` }}
                        />
                      ))}
                      <span
                        className="reportes-cuotas-gantt__segment"
                        style={{
                          left: `${item.inicioPercent}%`,
                          width: `${item.anchoPercent}%`,
                        }}
                      />
                      <span
                        className={`reportes-cuotas-gantt__bar reportes-cuotas-gantt__bar--${item.estado.toLocaleLowerCase("es-AR")}`}
                        style={{
                          left: `${item.inicioPercent}%`,
                          width: `${item.anchoPercent}%`,
                        }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

export function ReportesPage() {
  const { session } = useAuth();
  const canViewReportes = (session?.permisos ?? []).includes(
    VER_REPORTES_GIMNASIO,
  );
  const [filters, setFilters] = useState<FilterState>(() =>
    getDefaultFilters(),
  );
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(() =>
    getDefaultFilters(),
  );
  const [reportes, setReportes] = useState<ReportesGimnasio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeReport, setActiveReport] = useState<ActiveReport>("ocupacion");
  const [selectedDay, setSelectedDay] = useState<string>(() => getTodayName());
  const [selectedRiskSocioId, setSelectedRiskSocioId] = useState<number | null>(
    null,
  );
  const [selectedSocioCuotas, setSelectedSocioCuotas] = useState<CuotaSocio[]>(
    [],
  );
  const [isLoadingCuotas, setIsLoadingCuotas] = useState(false);
  const [cuotasError, setCuotasError] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const sankeyExportRef = useRef<HTMLDivElement | null>(null);
  const chartExportRef = useRef<HTMLDivElement | null>(null);
  const summaryExportRef = useRef<HTMLElement | null>(null);
  const retencionSummaryExportRef = useRef<HTMLElement | null>(null);
  const retencionTableExportRef = useRef<HTMLDivElement | null>(null);
  const retencionDetailExportRef = useRef<HTMLElement | null>(null);

  const ocupacionDia = useMemo(
    () =>
      reportes?.ocupacionHoraria.filter((item) => item.dia === selectedDay) ??
      [],
    [reportes, selectedDay],
  );
  const flujoReservasProfesorDia = useMemo(
    () =>
      reportes?.flujoReservasProfesor.filter(
        (item) => item.dia === selectedDay,
      ) ?? [],
    [reportes, selectedDay],
  );
  const sociosSeguimiento = useMemo(
    () => reportes?.sociosSeguimiento ?? reportes?.sociosRiesgo ?? [],
    [reportes],
  );
  const selectedRiskSocio = useMemo(
    () =>
      sociosSeguimiento.find(
        (item) => item.idUsuarioSocio === selectedRiskSocioId,
      ) ?? null,
    [sociosSeguimiento, selectedRiskSocioId],
  );

  const summaryCards = useMemo(() => {
    if (activeReport === "ocupacion") {
      const totalReservasDia = ocupacionDia.reduce(
        (total, item) => total + item.reservas,
        0,
      );
      const horariosConCupo = ocupacionDia.filter(
        (item) => item.cupoMaximo > 0,
      );
      const ocupacionPromedioDia =
        horariosConCupo.length > 0
          ? horariosConCupo.reduce(
              (total, item) => total + item.porcentajeOcupacion,
              0,
            ) / horariosConCupo.length
          : 0;
      const horarioMasDemandado =
        horariosConCupo.reduce<OcupacionHoraria | null>(
          (current, item) =>
            current === null ||
            item.porcentajeOcupacion > current.porcentajeOcupacion
              ? item
              : current,
          null,
        );
      const horarioMenosUtilizado =
        horariosConCupo.reduce<OcupacionHoraria | null>(
          (current, item) =>
            current === null ||
            item.porcentajeOcupacion < current.porcentajeOcupacion
              ? item
              : current,
          null,
        );
      const franjasAlta = ocupacionDia.filter(
        (item) => item.nivelDemanda === "Alta",
      ).length;
      const franjasBaja =
        ocupacionDia.filter(
          (item) =>
            item.nivelDemanda === "Baja" || item.nivelDemanda === "Sin uso",
        ).length ?? 0;

      return [
        {
          label: "Reservas del dia",
          value: totalReservasDia,
          note: `Turnos registrados para ${selectedDay} en el rango seleccionado.`,
        },
        {
          label: "Ocupacion promedio",
          value: formatPercent(ocupacionPromedioDia),
          note: horarioMasDemandado
            ? `Mayor demanda: ${horarioMasDemandado.rangoHorario}.`
            : "Sin horarios con cupo para comparar.",
        },
        {
          label: "Franjas con alta demanda",
          value: franjasAlta,
          note: "Horarios con ocupacion igual o superior al 80%.",
        },
        {
          label: "Franjas a revisar",
          value: franjasBaja,
          note: horarioMenosUtilizado
            ? `Menor uso: ${horarioMenosUtilizado.rangoHorario}.`
            : "Horarios con baja ocupacion o sin reservas.",
        },
      ];
    }

    return [
      {
        label: "Riesgo alto",
        value: reportes?.resumen.sociosRiesgoAlto ?? 0,
        note: "Socios que requieren contacto prioritario.",
      },
      {
        label: "Riesgo medio",
        value: reportes?.resumen.sociosRiesgoMedio ?? 0,
        note: "Socios para revisar adherencia y rutina.",
      },
      {
        label: "Sin rutina activa",
        value: reportes?.resumen.sociosSinRutinaActiva ?? 0,
        note: "Socios detectados con plan de entrenamiento incompleto.",
      },
      {
        label: "Ingreso por cuotas del mes",
        value: formatCurrency(reportes?.resumen.ingresoCuotasMesActual ?? 0),
        note: "Suma de cuotas pagadas con fecha de pago registrada en el mes actual.",
      },
    ];
  }, [activeReport, ocupacionDia, reportes, selectedDay]);

  const loadReportes = useCallback(async () => {
    if (!canViewReportes) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await reportesService.getReportesGimnasio(
        getDateRangeFromWeek(appliedFilters.semana),
      );
      setReportes(response);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "No pudimos cargar los reportes del gimnasio. Intenta nuevamente.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, canViewReportes]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadReportes();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadReportes]);

  useEffect(() => {
    if (activeReport !== "retencion") return;

    const socios = sociosSeguimiento;

    if (socios.length === 0) {
      setSelectedRiskSocioId(null);
      return;
    }

    if (
      !selectedRiskSocioId ||
      !socios.some((socio) => socio.idUsuarioSocio === selectedRiskSocioId)
    ) {
      setSelectedRiskSocioId(socios[0].idUsuarioSocio);
    }
  }, [activeReport, selectedRiskSocioId, sociosSeguimiento]);

  useEffect(() => {
    if (!selectedRiskSocioId) {
      setSelectedSocioCuotas([]);
      setCuotasError("");
      setIsLoadingCuotas(false);
      return;
    }

    let isCurrentRequest = true;

    setIsLoadingCuotas(true);
    setCuotasError("");

    reportesService
      .getCuotasSocio(selectedRiskSocioId)
      .then((response) => {
        if (isCurrentRequest) {
          setSelectedSocioCuotas(response);
        }
      })
      .catch((requestError) => {
        if (isCurrentRequest) {
          setSelectedSocioCuotas([]);
          setCuotasError(
            getApiErrorMessage(
              requestError,
              "No pudimos cargar las cuotas del socio seleccionado.",
            ),
          );
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsLoadingCuotas(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [selectedRiskSocioId]);

  if (!canViewReportes) {
    return <Navigate to="/gimnasio" replace />;
  }

  function updateWeek(value: string) {
    setFilters({
      semana: value,
    });
  }

  function applyFilters() {
    setAppliedFilters(filters);
  }

  function clearFilters() {
    const defaults = getDefaultFilters();
    setFilters(defaults);
    setAppliedFilters(defaults);
  }

  function toggleActiveReport() {
    setActiveReport((current) =>
      current === "ocupacion" ? "retencion" : "ocupacion",
    );
  }

  async function downloadOcupacionPdf() {
    const items = ocupacionDia;
    const sankeyElement = sankeyExportRef.current;
    const chartElement = chartExportRef.current;
    const summaryElement = summaryExportRef.current;

    if (items.length === 0 || isExportingPdf) return;

    setIsExportingPdf(true);
    setPdfError("");

    try {
      const [{ jsPDF }, { default: autoTable }, { default: html2canvas }] =
        await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
          import("html2canvas"),
        ]);
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      const appliedRange = getDateRangeFromWeek(appliedFilters.semana);
      const fechaDesde = formatInputDate(appliedRange.fechaDesde);
      const fechaHasta = formatInputDate(appliedRange.fechaHasta);
      const exportedAt = new Intl.DateTimeFormat("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date());

      doc.setProperties({
        title: `Ocupacion de ${selectedDay} por rango horario`,
        subject: `Reporte de ${selectedDay} del ${fechaDesde} al ${fechaHasta}`,
        creator: "MindFit Intelligence",
      });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`Ocupacion de ${selectedDay} por rango horario`, 14, 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Periodo: ${fechaDesde} al ${fechaHasta}`, 14, 23);
      doc.text(`Generado: ${exportedAt}`, 14, 29);

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageMargin = 14;
      const contentWidth = pageWidth - pageMargin * 2;
      const bottomMargin = 12;
      let currentY = 36;

      async function addElementImage(
        element: HTMLElement,
        backgroundColor: string,
      ) {
        const canvas = await html2canvas(element, {
          backgroundColor,
          onclone: forceLightThemeForPdf,
          scale: 2,
        });
        const imageData = canvas.toDataURL("image/png");
        const imageHeight = (canvas.height * contentWidth) / canvas.width;

        if (currentY + imageHeight > pageHeight - bottomMargin) {
          doc.addPage();
          currentY = pageMargin;
        }

        doc.addImage(
          imageData,
          "PNG",
          pageMargin,
          currentY,
          contentWidth,
          imageHeight,
          undefined,
          "FAST",
        );
        currentY += imageHeight + 8;
      }

      if (sankeyElement) {
        await addElementImage(sankeyElement, "#f8fafc");
      }

      if (chartElement) {
        await addElementImage(chartElement, "#f8fafc");
      }

      if (summaryElement) {
        await addElementImage(summaryElement, PDF_LIGHT_BACKGROUND);
      }

      const tableTitleY = currentY;
      const estimatedTableHeaderHeight = 10;

      if (
        tableTitleY + estimatedTableHeaderHeight >
        pageHeight - bottomMargin
      ) {
        doc.addPage();
        currentY = pageMargin;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Detalle de ocupacion por horario", pageMargin, currentY);
      currentY += 6;
      doc.setFont("helvetica", "normal");

      autoTable(doc, {
        startY: currentY,
        head: [["Dia", "Horario", "Cupo", "Reservas", "Ocupacion", "Demanda"]],
        body: items.map((item) => [
          item.dia,
          item.rangoHorario,
          item.cupoMaximo,
          item.reservas,
          formatPercent(item.porcentajeOcupacion),
          item.nivelDemanda,
        ]),
        styles: {
          cellPadding: 2.4,
          font: "helvetica",
          fontSize: 9,
          overflow: "linebreak",
          textColor: [51, 65, 85],
        },
        headStyles: {
          fillColor: [15, 118, 110],
          fontStyle: "bold",
          halign: "left",
          textColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: pageMargin, right: pageMargin },
        columnStyles: {
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
        },
      });

      doc.save(
        `reporte-ocupacion-${selectedDay.toLocaleLowerCase("es-AR")}-${appliedRange.fechaDesde}-${appliedRange.fechaHasta}.pdf`,
      );
    } catch {
      setPdfError("No pudimos generar el PDF. Intenta nuevamente.");
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function downloadRetencionPdf() {
    const summaryElement = retencionSummaryExportRef.current;
    const tableElement = retencionTableExportRef.current;
    const detailElement = retencionDetailExportRef.current;

    if (sociosSeguimiento.length === 0 || isExportingPdf) return;

    setIsExportingPdf(true);
    setPdfError("");

    try {
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      const exportedAt = new Intl.DateTimeFormat("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date());

      doc.setProperties({
        title: "Retencion y seguimiento de socios",
        subject: "Reporte actual de retencion y seguimiento de socios",
        creator: "MindFit Intelligence",
      });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Retencion y seguimiento de socios", 14, 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Base: estado actual y actividad reciente de socios.", 14, 23);
      doc.text(`Generado: ${exportedAt}`, 14, 29);

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageMargin = 14;
      const contentWidth = pageWidth - pageMargin * 2;
      const bottomMargin = 12;
      let currentY = 36;

      async function addElementImage(
        element: HTMLElement,
        backgroundColor: string,
      ) {
        const canvas = await html2canvas(element, {
          backgroundColor,
          onclone: forceLightThemeForPdf,
          scale: 2,
        });
        const imageData = canvas.toDataURL("image/png");
        const imageHeight = (canvas.height * contentWidth) / canvas.width;

        if (currentY + imageHeight > pageHeight - bottomMargin) {
          doc.addPage();
          currentY = pageMargin;
        }

        doc.addImage(
          imageData,
          "PNG",
          pageMargin,
          currentY,
          contentWidth,
          imageHeight,
          undefined,
          "FAST",
        );
        currentY += imageHeight + 8;
      }

      if (summaryElement) {
        await addElementImage(summaryElement, PDF_LIGHT_BACKGROUND);
      }

      if (tableElement) {
        await addElementImage(tableElement, PDF_LIGHT_BACKGROUND);
      }

      if (detailElement) {
        await addElementImage(detailElement, PDF_LIGHT_BACKGROUND);
      }

      doc.save(
        `reporte-retencion-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch {
      setPdfError("No pudimos generar el PDF. Intenta nuevamente.");
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <AppLayout>
      <main className="reportes-page">
        <section className="reportes-intro">
          <div>
            <span className="inicio-eyebrow">Gestionar gimnasio / REPORTES</span>
            <h1 className="dashboard-title">Reportes</h1>
            <p className="dashboard-copy">
              Indicadores del gimnasio para hacer seguimientos de los socios
            </p>
          </div>
          <BackToGymLink />
        </section>

        <section
          className="reportes-view-toolbar"
          aria-label="Selector de reporte"
        >
          <div>
            <span className="section-kicker">Vista actual</span>
            <h2>
              {activeReport === "ocupacion"
                ? "Ocupacion y demanda"
                : "Retencion y seguimiento"}
            </h2>
          </div>
          <button
            className="turnos-view-toggle reportes-view-toggle"
            type="button"
            aria-label={
              activeReport === "ocupacion"
                ? "Cambiar a reporte Retencion"
                : "Cambiar a reporte Ocupacion"
            }
            onClick={toggleActiveReport}
          >
            <span
              className={
                activeReport === "ocupacion"
                  ? "turnos-view-toggle__option turnos-view-toggle__option--active"
                  : "turnos-view-toggle__option"
              }
              aria-current={activeReport === "ocupacion" ? "true" : undefined}
            >
              Ocupacion
            </span>
            <span
              className={
                activeReport === "retencion"
                  ? "turnos-view-toggle__option turnos-view-toggle__option--active"
                  : "turnos-view-toggle__option"
              }
              aria-current={activeReport === "retencion" ? "true" : undefined}
            >
              Retencion
            </span>
          </button>
        </section>

        {isLoading ? (
          <p className="inicio-status">Cargando reportes...</p>
        ) : null}
        {error ? (
          <p className="inicio-status inicio-status--error">{error}</p>
        ) : null}

        {!isLoading && !error ? (
          <>
            {activeReport === "ocupacion" ? (
              <section
                className="reportes-filters"
                aria-label="Filtros de reportes"
              >
                <div className="reportes-week-filter">
                  <span className="reportes-filter-label">Semana</span>
                  <div className="reportes-filters__control-row">
                    <input
                      className="field-input"
                      type="week"
                      value={filters.semana}
                      onChange={(event) => updateWeek(event.target.value)}
                    />
                    <div className="reportes-filters__actions">
                      <button
                        className="primary-button reportes-apply-button"
                        type="button"
                        onClick={applyFilters}
                      >
                        Aplicar
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={clearFilters}
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                  <small className="reportes-week-range">
                    {formatWeekRange(filters.semana)}
                  </small>
                </div>
              </section>
            ) : null}

            <section className="reportes-grid">
              {activeReport === "ocupacion" ? (
                <article className="reportes-panel reportes-panel--wide">
                  <header className="reportes-panel__header">
                    <div>
                      <span className="section-kicker">
                        Ocupacion y demanda
                      </span>
                      <h2>Rangos horarios de {selectedDay}</h2>
                    </div>
                    <div className="reportes-panel__actions">
                      <button
                        className="primary-button reportes-download-button"
                        type="button"
                        disabled={isExportingPdf || ocupacionDia.length === 0}
                        onClick={() => void downloadOcupacionPdf()}
                      >
                        {isExportingPdf ? "Generando PDF..." : "Descargar PDF"}
                      </button>
                      {pdfError ? (
                        <small className="reportes-panel__status reportes-panel__status--error">
                          {pdfError}
                        </small>
                      ) : null}
                    </div>
                  </header>
                  <div
                    className="reportes-day-tabs"
                    role="tablist"
                    aria-label="Dias de la semana"
                  >
                    {WEEK_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        className={selectedDay === day ? "is-active" : ""}
                        aria-current={selectedDay === day ? "true" : undefined}
                        onClick={() => setSelectedDay(day)}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <div ref={sankeyExportRef}>
                    <ReservasProfesorSankey data={flujoReservasProfesorDia} />
                  </div>
                  <div ref={chartExportRef}>
                    <OcupacionHorariaChart data={ocupacionDia} />
                  </div>
                  <OcupacionTable items={ocupacionDia} />
                  <section
                    ref={summaryExportRef}
                    className="reportes-summary"
                    aria-label="Resumen de reportes"
                  >
                    {summaryCards.map((card) => (
                      <article
                        className="reportes-summary-card"
                        key={card.label}
                      >
                        <span>{card.label}</span>
                        <strong>{card.value}</strong>
                        <small>{card.note}</small>
                      </article>
                    ))}
                  </section>
                </article>
              ) : (
                <article className="reportes-panel reportes-panel--wide">
                  <header className="reportes-panel__header">
                    <div>
                      <span className="section-kicker">
                        Retencion y seguimiento
                      </span>
                      <h2>Seguimiento de socios</h2>
                    </div>
                    <div className="reportes-panel__actions">
                      <button
                        className="primary-button reportes-download-button"
                        type="button"
                        disabled={isExportingPdf || sociosSeguimiento.length === 0}
                        onClick={() => void downloadRetencionPdf()}
                      >
                        {isExportingPdf ? "Generando PDF..." : "Descargar PDF"}
                      </button>
                      {pdfError ? (
                        <small className="reportes-panel__status reportes-panel__status--error">
                          {pdfError}
                        </small>
                      ) : null}
                    </div>
                  </header>
                  <section
                    ref={retencionSummaryExportRef}
                    className="reportes-summary"
                    aria-label="Resumen de reportes"
                  >
                    {summaryCards.map((card) => (
                      <article
                        className="reportes-summary-card"
                        key={card.label}
                      >
                        <span>{card.label}</span>
                        <strong>{card.value}</strong>
                        <small>{card.note}</small>
                      </article>
                    ))}
                  </section>
                  <div ref={retencionTableExportRef}>
                    <SociosRiesgoTable
                      items={sociosSeguimiento}
                      selectedId={selectedRiskSocioId}
                      onSelect={setSelectedRiskSocioId}
                    />
                  </div>
                  <section ref={retencionDetailExportRef}>
                    <SocioCuotasPanel
                      socio={selectedRiskSocio}
                      cuotas={selectedSocioCuotas}
                      isLoading={isLoadingCuotas}
                      error={cuotasError}
                    />
                  </section>
                </article>
              )}
            </section>
          </>
        ) : null}
      </main>
    </AppLayout>
  );
}
