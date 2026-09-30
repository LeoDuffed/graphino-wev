import { useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  Bot,
  CheckCircle2,
  CircuitBoard,
  Clock3,
  Factory,
  Radar,
  Users,
  Wifi,
} from "lucide-react"

type MachineStatus = "operando" | "paro-solicitado" | "paro-confirmado"
type ZoneId = "A" | "B" | "C" | "D"

type Detection = {
  robotId: string
  classification: string
  confidence: number
  distance: string
  direction: string
  time: string
}

type Zone = {
  id: ZoneId
  machine: string
  status: MachineStatus
  robots: string[]
  people: number
  detection?: Detection
}

const zones: Zone[] = [
  {
    id: "A",
    machine: "Equipo A",
    status: "paro-confirmado",
    robots: ["Rb-01"],
    people: 1,
    detection: {
      robotId: "Rb-01",
      classification: "Posible humano",
      confidence: 92,
      distance: "3.8 m",
      direction: "Frente derecha",
      time: "013:23:58",
    },
  },
  { id: "B", machine: "Equipo B", status: "operando", robots: ["Rb-02"], people: 0 },
  { id: "C", machine: "Equipo C", status: "operando", robots: ["Rb-03"], people: 0 },
  {
    id: "D",
    machine: "Equipo D",
    status: "paro-confirmado",
    robots: ["Rb-04"],
    people: 1,
    detection: {
      robotId: "Rb-04",
      classification: "Posible humano",
      confidence: 87,
      distance: "4.6 m",
      direction: "Lado izquierdo",
      time: "013:24:12",
    },
  },
]

const robots = [
  { id: "Rb-01", zone: "A" as ZoneId, battery: 84, lastReport: "13:24:08" },
  { id: "Rb-02", zone: "B" as ZoneId, battery: 71, lastReport: "13:24:11" },
  { id: "Rb-03", zone: "C" as ZoneId, battery: 93, lastReport: "13:24:13" },
  { id: "Rb-04", zone: "D" as ZoneId, battery: 58, lastReport: "13:24:09" },
]

const events = [
  { time: "13:24:14", zone: "D", origin: "Equipo D", event: "Paro confirmado", detail: "Respuesta recibida", important: false },
  { time: "13:24:12", zone: "D", origin: "Rb-04", event: "Posible humano", detail: "4.6 m · confianza 87%", important: false },
  { time: "13:24:10", zone: "C", origin: "Rb-03", event: "Objeto detectado", detail: "Sin solicitud de paro", important: false },
  { time: "13:24:00", zone: "A", origin: "Equipo A", event: "Paro confirmado", detail: "Respuesta recibida", important: false },
  { time: "13:23:58", zone: "A", origin: "Rb-01", event: "Posible humano", detail: "3.8 m · confianza 92%", important: false },
  { time: "13:21:30", zone: "B", origin: "Rb-02", event: "Objeto detectado", detail: "Sin solicitud de paro", important: false },
  { time: "13:20:41", zone: "C", origin: "Rb-03", event: "Objeto detectado", detail: "Sin solicitud de paro", important: false },
]

const statusLabels: Record<MachineStatus, string> = {
  operando: "Operando",
  "paro-solicitado": "Paro solicitado",
  "paro-confirmado": "Paro confirmado",
}

function MachineStatusTag({ status, dark = false }: { status: MachineStatus; dark?: boolean }) {
  const style = dark
    ? status === "paro-solicitado"
      ? "bg-white text-black"
      : status === "paro-confirmado"
        ? "border border-white/50 bg-white/10 text-white"
        : "border border-white/15 bg-white/5 text-white/55"
    : status === "paro-solicitado"
      ? "bg-black text-white"
      : status === "paro-confirmado"
        ? "border border-black/25 bg-[#DCDCDC]/55 text-black"
        : "border border-black/10 bg-white text-neutral-500"

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${style}`}>{statusLabels[status]}</span>
}

function ZoneCard({ zone, selected, onSelect }: { zone: Zone; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`Zona ${zone.id}, ${zone.machine}, ${statusLabels[zone.status]}, ${zone.people} ${zone.people === 1 ? "posible persona" : "posibles personas"}`}
      onClick={onSelect}
      className={`group flex min-h-[178px] flex-col rounded-xl border p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
        selected ? "border-white bg-white/12" : "border-white/10 bg-white/[0.035] hover:border-white/40 hover:bg-white/[0.07]"
      }`}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/45">Zona {zone.id}</p>
          <h3 className="mt-2 text-lg font-medium text-white">{zone.machine}</h3>
        </div>
        <Factory className="size-5 shrink-0 text-white/45" aria-hidden="true" />
      </div>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
        <div>
          <MachineStatusTag status={zone.status} dark />
          <p className="mt-3 text-xs text-white/55">
            {zone.people > 0 ? `${zone.people} posible persona · ${zone.robots.join(", ")}` : `Sin presencia reportada · ${zone.robots.join(", ")}`}
          </p>
        </div>
        <ArrowRight className={`size-4 shrink-0 transition-transform group-hover:translate-x-1 ${selected ? "text-white" : "text-white/35"}`} aria-hidden="true" />
      </div>
    </button>
  )
}

export function DashboardPage() {
  const [selectedZoneId, setSelectedZoneId] = useState<ZoneId>("C")
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? zones[0]
  const peopleInRiskZones = zones.reduce((total, zone) => total + zone.people, 0)
  const stoppedMachines = zones.filter((zone) => zone.status === "paro-confirmado").length
  const pendingStops = zones.filter((zone) => zone.status === "paro-solicitado").length

  const metrics = [
    { icon: Users, label: "Personas en zonas de riesgo", value: String(peopleInRiskZones).padStart(2, "0"), detail: "Estimación de la simulación" },
    { icon: CheckCircle2, label: "Paros confirmados", value: String(stoppedMachines).padStart(2, "0"), detail: "Respuesta recibida del equipo" },
    { icon: AlertTriangle, label: "Paros sin confirmar", value: String(pendingStops).padStart(2, "0"), detail: "Requiere seguimiento" },
    { icon: Bot, label: "Robots conectados", value: `${robots.length}/${robots.length}`, detail: "Último reporte registrado" },
  ]

  return (
    <div className="bg-[#f6f6f6]">
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-5 py-8 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium tracking-[0.16em] text-neutral-500">
              <span className="size-2 rounded-full bg-black" /> SIMULACIÓN · DATOS DE EJEMPLO
            </p>
            <h1 className="mt-3 text-3xl font-medium tracking-[-0.045em] sm:text-4xl">Centro de control</h1>
            <p className="mt-2 text-sm text-neutral-500">Supervisión de detecciones, zonas de riesgo y respuesta de maquinaria.</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] space-y-5 px-5 py-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de la simulación">
          {metrics.map(({ icon: Icon, label, value, detail }) => (
            <article className="rounded-2xl border border-black/10 bg-white p-5" key={label}>
              <div className="flex items-start justify-between gap-3 text-neutral-500"><span className="text-xs">{label}</span><Icon className="size-4 shrink-0" aria-hidden="true" /></div>
              <p className="mt-5 text-3xl font-medium tracking-[-0.05em] tabular-nums">{value}</p>
              <p className="mt-1 text-xs text-neutral-400">{detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.55fr_.85fr]">
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#121212] text-white">
            <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div><h2 className="text-base font-medium">Planta por zonas</h2></div>
              <span className="self-start rounded-md border border-white/15 px-2.5 py-1 font-mono text-[10px] text-white/55">PLANTA A · DEMO</span>
            </div>
            <div className="factory-grid p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {zones.map((zone) => <ZoneCard key={zone.id} zone={zone} selected={zone.id === selectedZoneId} onSelect={() => setSelectedZoneId(zone.id)} />)}
              </div>
              <p className="mt-5 text-xs leading-relaxed text-white/45">Selecciona una zona para ver su detección y el estado reportado por la maquinaria. La distancia y orientación son relativas al carrito.</p>
            </div>
          </div>

          <aside className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6" aria-live="polite">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400">Detalle de zona</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">Zona {selectedZone.id}</h2><p className="mt-1 text-sm text-neutral-500">{selectedZone.machine}</p></div><Factory className="size-5 text-neutral-400" aria-hidden="true" /></div>

            <div className="mt-6 rounded-xl bg-[#121212] p-5 text-white">
              <p className="text-[11px] uppercase tracking-[0.15em] text-white/45">Estado de maquinaria</p>
              <div className="mt-3"><MachineStatusTag status={selectedZone.status} dark /></div>
              <p className="mt-3 text-xs leading-relaxed text-white/55">
                {selectedZone.status === "paro-solicitado" ? "Se registró la solicitud de paro. Aún no hay confirmación del equipo." : selectedZone.status === "paro-confirmado" ? "El equipo reportó que el paro fue ejecutado." : "Sin solicitud de paro registrada en esta simulación."}
              </p>
            </div>

            {selectedZone.detection ? (
              <div className="mt-6">
                <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium">Detección asociada</h3><span className="font-mono text-xs text-neutral-400">{selectedZone.detection.time}</span></div>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-black/10 px-4 py-3"><span className="flex items-center gap-2 text-sm"><Radar className="size-4" aria-hidden="true" /> {selectedZone.detection.classification}</span><span className="rounded-md bg-[#DCDCDC]/60 px-2 py-1 font-mono text-xs">{selectedZone.detection.confidence}%</span></div>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="text-xs text-neutral-400">Detectó</dt><dd className="mt-1 font-medium">{selectedZone.detection.robotId}</dd></div>
                  <div><dt className="text-xs text-neutral-400">Distancia al carrito</dt><dd className="mt-1 font-mono font-medium">{selectedZone.detection.distance}</dd></div>
                  <div className="col-span-2"><dt className="text-xs text-neutral-400">Orientación relativa</dt><dd className="mt-1 font-medium">{selectedZone.detection.direction}</dd></div>
                </dl>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-black/15 p-5"><p className="text-sm font-medium">Sin detecciones humanas</p><p className="mt-1 text-xs leading-relaxed text-neutral-500">Los carritos de esta zona no han reportado una posible persona en el escenario mostrado.</p></div>
            )}
          </aside>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-base font-medium">Estado de la flota</h2><p className="mt-1 text-xs text-neutral-400">Selecciona un carrito para consultar su zona</p></div><span className="flex items-center gap-1.5 text-xs text-neutral-500"><Wifi className="size-3.5" aria-hidden="true" /> 4 de 4 conectados en la simulación</span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {robots.map((robot) => (
              <button key={robot.id} type="button" onClick={() => setSelectedZoneId(robot.zone)} className="rounded-xl border border-black/10 bg-white p-4 text-left transition-colors hover:bg-[#DCDCDC]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-medium"><Bot className="size-4" aria-hidden="true" />{robot.id}</span><span className="size-2 rounded-full bg-black" aria-label="Conectado" /></div>
                <p className="mt-2 text-xs text-neutral-500">Zona {robot.zone} · último reporte {robot.lastReport}</p>
                <div className="mt-5 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#DCDCDC]"><div className="h-full bg-black" style={{ width: `${robot.battery}%` }} /></div><span className="flex items-center gap-1 font-mono text-xs text-neutral-500"><BatteryCharging className="size-3.5" aria-hidden="true" />{robot.battery}%</span></div>
              </button>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          <div className="flex flex-col gap-2 border-b border-black/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-base font-medium">Bitácora de eventos</h2><p className="mt-1 text-xs text-neutral-400">Secuencia simulada de detección y respuesta</p></div><span className="self-start rounded-md bg-[#DCDCDC]/55 px-2.5 py-1 text-[10px] font-medium tracking-wider">DATOS DE EJEMPLO</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-black/10 text-[11px] font-medium uppercase tracking-wider text-neutral-400"><tr><th className="px-5 py-3 font-medium">Hora</th><th className="px-5 py-3 font-medium">Zona</th><th className="px-5 py-3 font-medium">Origen</th><th className="px-5 py-3 font-medium">Evento</th><th className="px-5 py-3 font-medium">Detalle</th></tr></thead><tbody className="divide-y divide-black/5">{events.map((event) => <tr className={event.important ? "bg-[#DCDCDC]/25" : "hover:bg-neutral-50"} key={`${event.time}-${event.event}`}><td className="px-5 py-4 font-mono text-xs text-neutral-500"><span className="inline-flex items-center gap-1"><Clock3 className="size-3" aria-hidden="true" />{event.time}</span></td><td className="px-5 py-4 font-medium">{event.zone}</td><td className="px-5 py-4 text-neutral-600">{event.origin}</td><td className="px-5 py-4"><span className={`font-medium ${event.important ? "underline decoration-black/30 underline-offset-4" : ""}`}>{event.event}</span></td><td className="px-5 py-4 text-neutral-500">{event.detail}</td></tr>)}</tbody></table></div>
        </section>

      </div>
    </div>
  )
}
