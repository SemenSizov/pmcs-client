import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Accordion, ListGroup, ListGroupItem } from 'react-bootstrap';
import type { AxiosError } from 'axios';
import api from '../api/api';
import ColoredDot from '../components/ColoredDot';

export type ProcedureType = 'period' | 'hours';
export type ProcedurePeriod = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';
type status = 'ok' | 'warning' | 'error'

export interface DashboardEntry {
  location_id: number;
  location_name: string;
  unit_serial: string;
  equipment_type: string;
  procedure_name: string;
  procedure_type: ProcedureType;
  procedure_hours: number;
  procedure_period: ProcedurePeriod;
  last_log_date: string; // 'YYYY-MM-DD'
  last_log_hours: number | null;
  last_meter_hours: number | null;
  status?: status;
}

export interface UnitGroup {
  serial: string;
  equipment_type: string;
  hours: number | null;
  entries: DashboardEntry[];
}

export interface LocationGroup {
  id: number;
  name: string;
  units: UnitGroup[];
}

interface DashboardEntryProc extends DashboardEntry {
  intervalToNext: number;
  intervalToNextStr: string;
}

interface UnitGroupProc extends UnitGroup {
  name: string;
  procedures: string[];
  hasAlarm: boolean;
  status: status;
  entriesProc: DashboardEntryProc[]
}

interface LocationGroupProc extends LocationGroup {
  name: string;
  hasAlarm: boolean;
  status: status;
  unitsProc: UnitGroupProc[]
}

function getEntryProc(de: DashboardEntry): DashboardEntryProc {
  const interval = de.procedure_type === 'hours' ? de.last_log_hours! + de.procedure_hours - de.last_meter_hours! :
    diffDaysFromToday(fmtDate(de.last_log_date), de.procedure_period)
  return {
    ...de,
    intervalToNext: interval,
    intervalToNextStr: de.procedure_type === 'hours' ? `${interval}  годин` : `${interval} днів`
  }
}

function getUnitGroupProc(ug: UnitGroup, entries: DashboardEntryProc[]): UnitGroupProc {
  const procStatuses = entries.map(e => e.status)
  const stat: status = procStatuses.some(ps => ps === 'error') ? 'error' : (procStatuses.some(ps => ps === 'warning') ? 'warning' : 'ok')
  return {
    ...ug,
    name: `${ug.equipment_type} - ${ug.serial}`,
    hasAlarm: stat !== 'ok',
    status: stat,
    procedures: entries.map(e => e.procedure_name),
    entriesProc: entries
  }
}

function getLocationGroupProc(lg: LocationGroup, uGroups: UnitGroupProc[]): LocationGroupProc {
  const ugStatuses = uGroups.map(ug => ug.status)
  const stat: status = ugStatuses.some(us => us === 'error') ? 'error' : (ugStatuses.some(us => us === 'warning') ? 'warning' : 'ok')
  return {
    ...lg,
    status: stat,
    hasAlarm: stat !== 'ok',
    unitsProc: uGroups
  }
}


async function getDashboard(): Promise<LocationGroup[]> {
  const res = await api.get<LocationGroup[]>('/dashboard'); // baseURL вже має /api
  return res.data;
}

function valOrDash(n?: number | null) {
  return n === null || n === undefined ? '—' : n;
}

function periodLabel(p: ProcedurePeriod) {
  switch (p) {
    case 'weekly':
      return 'щотижнево';
    case 'monthly':
      return 'щомісячно';
    case 'quarterly':
      return 'щоквартально';
    case 'semiannual':
      return 'раз на півроку';
    case 'annual':
      return 'щорічно';
    default:
      return p;
  }
}

function fmtDate(s?: string | null) {
  if (!s) return '—';
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function diffDaysFromToday(ymd: string, procPeriod: ProcedurePeriod) {
  let procPeriodDays = 7
  if (procPeriod === 'monthly') {
    procPeriodDays = 30
  }
  if (procPeriod === 'quarterly') {
    procPeriodDays = 90
  }
  if (procPeriod === 'semiannual') {
    procPeriodDays = 180
  }
  if (procPeriod === 'annual') {
    procPeriodDays = 360
  }
  const d = parseYMDtoUTC(ymd);
  if (!d) throw new Error('Invalid date format. Expected YYYY-MM-DD');

  const now = new Date();
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const inputUTC = d.getTime();

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return procPeriodDays - Math.round((todayUTC - inputUTC) / MS_PER_DAY);
}

function parseYMDtoUTC(ymd: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = +m[1],
    mo = +m[2],
    d = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  // Валідація на випадок 2025-02-31 тощо
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  return dt;
}


function filterFailedEntries(data: LocationGroupProc[]): LocationGroupProc[] {
  const result = data.filter(l => l.hasAlarm)
  for (const loc of result) {
    loc.unitsProc = loc.unitsProc.filter(u => u.hasAlarm)
    for (const unit of loc.unitsProc) {
      unit.entriesProc = unit.entriesProc.filter(e => e.status !== 'ok')
    }
  }
  return result
}

// CSS-in-JS для кращого десктоп-лейаута без окремого файла
const DASHBOARD_CSS = `
/* Завжди одна колонка */
.entry-row { display: flex; flex-direction: column; gap: .25rem; }

/* Назва процедури: ламаємо довгі слова, без горизонтального скролу */
.entry-title { overflow-wrap: anywhere; }

/* Внутрішні блоки */
.entry-left  { min-width: 0; }
.entry-right { text-align: start; }
`;

export default function DashboardPage() {
  const [data, setData] = useState<LocationGroupProc[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<LocationGroupProc[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const payload = await getDashboard();
        if (alive) {
          const locationsData: LocationGroupProc[] = []
          for (const locGroup of payload) {
            const uGroup: UnitGroupProc[] = []
            for (let unit of locGroup.units) {
              const entries: DashboardEntryProc[] = unit.entries.map(de => getEntryProc(de));
              uGroup.push(getUnitGroupProc(unit, entries))
            }
            locationsData.push(getLocationGroupProc(locGroup, uGroup))
          }
          setData(locationsData);

          setSummary(filterFailedEntries(data!))
        }
      } catch (e) {
        const err = e as AxiosError<{ message?: string }>;
        if (alive) setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100svh' }}>
        <Spinner animation="border" role="status" />
        <span className="ms-2">Завантаження…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-3 px-2 px-sm-3">
        <Alert variant="danger" className="mb-0">
          Помилка: {error}
        </Alert>
      </Container>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Container className="py-3 px-2 px-sm-3">
        <Alert variant="secondary" className="mb-0">
          Даних для відображення немає.
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <style>{DASHBOARD_CSS}</style>
      <Container fluid className="py-3 px-2 px-sm-3">
        {summary &&
          <Row s={1} sm={1} md={1} xl={1} className="g-2 g-sm-3">
            <Col key='qwerty'>
              <Accordion alwaysOpen flush>
                <Accordion.Item eventKey="asdf">
                  <Accordion.Header><div className="fw-semibold entry-title">Роботи для проведення</div></Accordion.Header>
                  <Accordion.Body>
                    <div className="fw-semibold entry-title">
                      <ListGroup>
                        {summary.map(l => {
                          return (<ListGroupItem key={l.name}>
                            <ColoredDot status={l.status} />
                            {l.name}
                            <ListGroup>
                              {l.unitsProc.map(u =>
                                <ListGroupItem key={u.name}>
                                  <ColoredDot status={u.status} />
                                  {u.name}
                                  <ListGroup>
                                    {u.entriesProc.map(p =>
                                      <ListGroupItem key={p.procedure_name}>
                                        <ColoredDot status={p.status!} />
                                        {p.procedure_name} : {p.intervalToNextStr}
                                      </ListGroupItem>)
                                    }
                                  </ListGroup>
                                </ListGroupItem>
                              )}
                            </ListGroup>
                          </ListGroupItem>)
                        })}
                      </ListGroup>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>

            </Col>
          </Row>}
        <Row xs={1} sm={1} md={2} xl={3} className="g-2 g-sm-3">
          {data.map((loc) => (
            <Col key={loc.id}>
              <Card className="h-100 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center py-2">
                  <strong className="text-break">{loc.name}</strong>
                  <Badge bg="primary" pill title="Статус юнітів">
                    {loc.status}
                  </Badge>
                </Card.Header>

                <Card.Body className="py-2">
                  {loc.units.length === 0 ? (
                    <div className="text-muted small">Обладнання відсутнє</div>
                  ) : (
                    <Accordion alwaysOpen flush>
                      {loc.unitsProc.map((u, idx) => (
                        <Accordion.Item eventKey={String(idx)} key={`${loc.id}:${u.serial}`}>
                          <Accordion.Header>
                            <div className="d-flex flex-column">
                              <div className="d-flex align-items-center gap-2">
                                <ColoredDot status={loc.status} />
                                <span className="fw-semibold text-break fs-6">{u.serial}</span>
                              </div>
                              <small className="text-muted">{u.equipment_type}</small>
                              {u.hours && <small className="text-muted">Мотогодини: {u.hours}</small>}
                            </div>
                          </Accordion.Header>
                          <Accordion.Body className="py-2">
                            {u.entries.length === 0 ? (
                              <div className="text-muted small">Немає записів</div>
                            ) : (
                              <ListGroup variant="flush">
                                {u.entriesProc.map((e, i) =>
                                  <ListGroup.Item key={`${e.procedure_name}:${i}`} className="py-2">
                                    <div className="entry-row">
                                      {/* Ліва частина */}
                                      <div className="entry-left">
                                        <div className="d-flex align-items-center gap-2">
                                          <ColoredDot status={e.status!} />
                                          <div className="fw-semibold entry-title">{e.procedure_name}</div>
                                        </div>
                                        <small className="text-muted">
                                          {e.procedure_type === 'hours' ? (
                                            <>Періодичність: кожні {e.procedure_hours} мотогод.</>
                                          ) : (
                                            <>Періодичність: {periodLabel(e.procedure_period)}</>
                                          )}
                                        </small>
                                      </div>

                                      {/* Права частина */}
                                      <div className="entry-right d-grid small">
                                        <div>
                                          <span className="text-muted me-1">Дата:</span>
                                          <strong>{fmtDate(e.last_log_date)}</strong>
                                        </div>
                                        {e.last_log_hours && <div>
                                          <span className="text-muted me-1">Мотогодини:</span>
                                          <span className="fw-semibold">{valOrDash(e.last_log_hours)}</span>
                                        </div>}
                                        {
                                          // (e.last_meter_hours !== null || e.last_log_hours !== null) && (
                                          <div>
                                            <span className="text-muted me-1">До наступної:</span>
                                            {e.intervalToNextStr}
                                          </div>
                                          // )
                                        }
                                      </div>
                                    </div>
                                  </ListGroup.Item>
                                )
                                }
                              </ListGroup>
                            )}
                          </Accordion.Body>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}
