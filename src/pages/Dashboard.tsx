import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Accordion, ListGroup } from 'react-bootstrap';
import type { AxiosError } from 'axios';
// ⚠️ Підкоригуй імпорт під свій axios-клієнт (baseURL має містити /api)
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

function statusMeta(status?: 'ok' | 'warning' | 'error') {
  switch (status) {
    case 'ok':
      return { label: 'OK', variant: 'success' as const, bgClass: 'bg-success' };
    case 'warning':
      return { label: 'Увага', variant: 'warning' as const, bgClass: 'bg-warning' };
    case 'error':
      return { label: 'Прострочено', variant: 'danger' as const, bgClass: 'bg-danger' };
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
/* Рівень запису: одна колонка на мобілці, 2 колонки на >= sm */
.entry-row { display: flex; flex-direction: column; gap: .25rem; }
@media (min-width: 576px) {
  .entry-row { display: grid; grid-template-columns: 1fr auto; column-gap: 1rem; align-items: start; }
}

/* Заголовок процедури: на мобілці ламаємо де завгодно, на десктопі — нормальний перенос слів */
.entry-title { overflow-wrap: anywhere; }
@media (min-width: 576px) {
  .entry-title { overflow-wrap: normal; word-break: normal; }
}

/* Лівий/правий блоки усередині запису */
.entry-left { min-width: 0; }
.entry-right { text-align: start; }
@media (min-width: 576px) {
  .entry-right { text-align: end; min-width: 260px; }
}
`;

export default function DashboardPage() {
  const [data, setData] = useState<LocationGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const payload = await getDashboard();
        if (alive) setData(payload);
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
                              <span className="fw-semibold text-break fs-6">{u.serial}</span>
                              <small className="text-muted">{u.equipment_type}</small>
                              <small className="text-muted">Мотогодини: {u.hours || '--'}</small>
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
                                      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-1">
                                        {/* Ліва частина */}
                                        <div className="me-sm-3">
                                          <div className="d-flex align-items-center gap-2">
                                            <span
                                              className={sm.bgClass}
                                              style={STATUS_DOT_STYLE}
                                              title={sm.label}
                                              aria-label={sm.label}
                                            />
                                            <div className="fw-semibold text-break">{e.procedure_name}</div>
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
                                        <div className="d-grid text-start text-sm-end small">
                                          <div>
                                            <span className="text-muted me-1">Дата:</span>
                                            <strong>{fmtDate(e.last_log_date)}</strong>
                                          </div>
                                          <div>
                                            <span className="text-muted me-1">Мотогодини:</span>
                                            <span className="fw-semibold">{valOrDash(e.last_log_hours)}</span>
                                          </div>
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
