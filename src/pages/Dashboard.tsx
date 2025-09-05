import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Accordion, ListGroup, ListGroupItem } from 'react-bootstrap';
import type { AxiosError } from 'axios';
import api from '../api/api';

export type ProcedureType = 'period' | 'hours';
export type ProcedurePeriod = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';

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
  status?: 'ok' | 'warning' | 'error';
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

interface UnitSummary {
  name: string;
  procedures: string[]
}

interface LocationSummary {
  name: string;
  hasAlarm: boolean;
  units: UnitSummary[]
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

function statusMeta(status?: 'ok' | 'warning' | 'error') {
  switch (status) {
    case 'ok':
      return { label: 'OK', variant: 'success' as const, bgClass: 'bg-success' };
    case 'warning':
      return { label: 'Увага', variant: 'warning' as const, bgClass: 'bg-warning' };
    case 'error':
      return { label: 'Увага', variant: 'danger' as const, bgClass: 'bg-danger' };
    default:
      return { label: 'Н/д', variant: 'secondary' as const, bgClass: 'bg-secondary' };
  }
}

const STATUS_DOT_STYLE: React.CSSProperties = {
  display: 'inline-block',
  width: '.6rem',
  height: '.6rem',
  borderRadius: 9999,
};

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
  const [data, setData] = useState<LocationGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<LocationSummary[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const payload = await getDashboard();
        if (alive) {
          setData(payload);
          const sum: LocationSummary[] = [];
          for (const locGroup of payload) {
            const loc = {} as any
            loc.name = locGroup.name;
            loc.hasAlarm = false;
            loc.units = []
            for (const unit of locGroup.units) {
              const u = {} as any
              let hasAlarm = false;
              u.procedures = []
              u.name = `${unit.equipment_type} - ${unit.serial}`
              for (const entry of unit.entries) {
                if (entry.status !== 'ok') {
                  u.procedures.push(entry.procedure_name)
                  hasAlarm = true
                }
              }
              if (hasAlarm) {
                loc.hasAlarm = true
                loc.units.push(u)
              }
            }
            if (loc.hasAlarm) {
              sum.push(loc)
            }
          }
          setSummary(sum)
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
                        {summary.map(l =>
                        (<ListGroupItem key={l.name}>
                          {l.name}
                          <ListGroup>
                            {l.units.map(u => (
                              <ListGroupItem key={u.name}>
                                {u.name}
                                <ListGroup>
                                  {u.procedures.map(p => (
                                    <ListGroupItem key={p}>
                                      {p}
                                    </ListGroupItem>))}
                                </ListGroup>
                              </ListGroupItem>
                            ))}
                          </ListGroup>
                        </ListGroupItem>)
                        )}
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
                  <Badge bg="primary" pill title="Кількість юнітів">
                    {loc.units.length}
                  </Badge>
                </Card.Header>

                <Card.Body className="py-2">
                  {loc.units.length === 0 ? (
                    <div className="text-muted small">Обладнання відсутнє</div>
                  ) : (
                    <Accordion alwaysOpen flush>
                      {loc.units.map((u, idx) => (
                        <Accordion.Item eventKey={String(idx)} key={`${loc.id}:${u.serial}`}>
                          <Accordion.Header>
                            <div className="d-flex flex-column">
                              <div className="d-flex align-items-center gap-2">
                                {u.entries.some((e) => e.status !== 'ok') ? (
                                  <span
                                    className="bg-warning"
                                    style={STATUS_DOT_STYLE}
                                    title="Увага"
                                    aria-label="Увага"
                                  />
                                ) : (
                                  <span
                                    className="bg-success"
                                    style={STATUS_DOT_STYLE}
                                    title="OK"
                                    aria-label="OK"
                                  />
                                )}
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
                                {u.entries.map((e, i) => {
                                  const sm = statusMeta(e.status);
                                  return (
                                    <ListGroup.Item key={`${e.procedure_name}:${i}`} className="py-2">
                                      <div className="entry-row">
                                        {/* Ліва частина */}
                                        <div className="entry-left">
                                          <div className="d-flex align-items-center gap-2">
                                            <span
                                              className={sm.bgClass}
                                              style={STATUS_DOT_STYLE}
                                              title={sm.label}
                                              aria-label={sm.label}
                                            />
                                            <div className="fw-semibold entry-title">{e.procedure_name}</div>
                                            {/* Текстовий бейдж — схований на xs, видимий від sm */}
                                            <span className={`badge bg-${sm.variant} d-none d-sm-inline`}>
                                              {sm.label}
                                            </span>
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
                                              {e.procedure_type === 'hours' ? (
                                                <strong>
                                                  {e.last_log_hours! + e.procedure_hours - e.last_meter_hours!} годин
                                                </strong>
                                              ) : (
                                                <strong>{diffDaysFromToday(fmtDate(e.last_log_date), e.procedure_period)} днів</strong>
                                              )}
                                            </div>
                                            // )
                                          }
                                        </div>
                                      </div>
                                    </ListGroup.Item>
                                  );
                                })}
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
