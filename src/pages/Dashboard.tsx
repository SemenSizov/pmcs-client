import { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Accordion, ListGroup, ListGroupItem, Button } from 'react-bootstrap';
import type { AxiosError } from 'axios';
import api from '../api/api';
import ColoredDot from '../components/ColoredDot';
import AddLogEntryModal from '../components/AddLogEntryModal';

export type ProcedureType = 'period' | 'hours';
export type ProcedurePeriod = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';
type status = 'ok' | 'warning' | 'error'

export interface DashboardEntry {
  unit_id: number; // Має приходити з бекенду для ідентифікації пристрою
  location_id: number;
  location_name: string;
  unit_serial: string;
  equipment_type: string;
  procedure_id: number;
  procedure_name: string;
  procedure_type: ProcedureType;
  procedure_hours: number;
  procedure_period: ProcedurePeriod;
  last_log_date: string;
  last_log_hours: number | null;
  last_meter_hours: number | null;
  status?: status;
}

export interface UnitGroup {
  id: number;
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

// Допоміжні функції
function fmtDate(s?: string | null) {
  if (!s) return '—';
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function parseYMDtoUTC(ymd: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}

function diffDaysFromToday(ymd: string, procPeriod: ProcedurePeriod) {
  let procPeriodDays = 7;
  if (procPeriod === 'monthly') procPeriodDays = 30;
  if (procPeriod === 'quarterly') procPeriodDays = 90;
  if (procPeriod === 'semiannual') procPeriodDays = 180;
  if (procPeriod === 'annual') procPeriodDays = 360;

  const d = parseYMDtoUTC(ymd);
  if (!d) return 0;

  const now = new Date();
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const inputUTC = d.getTime();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return procPeriodDays - Math.round((todayUTC - inputUTC) / MS_PER_DAY);
}

function getEntryProc(de: DashboardEntry): DashboardEntryProc {
  const interval = de.procedure_type === 'hours'
    ? (de.last_log_hours || 0) + de.procedure_hours - (de.last_meter_hours || 0)
    : diffDaysFromToday(fmtDate(de.last_log_date), de.procedure_period);

  return {
    ...de,
    intervalToNext: interval,
    intervalToNextStr: de.procedure_type === 'hours' ? `${interval} год.` : `${interval} дн.`
  };
}

function getUnitGroupProc(ug: UnitGroup, entries: DashboardEntryProc[]): UnitGroupProc {
  const procStatuses = entries.map(e => e.status);
  const stat: status = procStatuses.some(ps => ps === 'error') ? 'error' : (procStatuses.some(ps => ps === 'warning') ? 'warning' : 'ok');
  return {
    ...ug,
    name: `${ug.equipment_type} - ${ug.serial}`,
    hasAlarm: stat !== 'ok',
    status: stat,
    procedures: entries.map(e => e.procedure_name),
    entriesProc: entries
  };
}

function getLocationGroupProc(lg: LocationGroup, uGroups: UnitGroupProc[]): LocationGroupProc {
  const ugStatuses = uGroups.map(ug => ug.status);
  const stat: status = ugStatuses.some(us => us === 'error') ? 'error' : (ugStatuses.some(us => us === 'warning') ? 'warning' : 'ok');
  return {
    ...lg,
    name: lg.name,
    status: stat,
    hasAlarm: stat !== 'ok',
    unitsProc: uGroups
  };
}

function filterFailedEntries(data: LocationGroupProc[]): LocationGroupProc[] {
  return data
    .filter(l => l.hasAlarm)
    .map(l => ({
      ...l,
      unitsProc: l.unitsProc
        .filter(u => u.hasAlarm)
        .map(u => ({
          ...u,
          entriesProc: u.entriesProc.filter(e => e.status !== 'ok')
        }))
    }));
}

const DASHBOARD_CSS = `
.entry-row { display: flex; flex-direction: column; gap: .25rem; }
.entry-title { overflow-wrap: anywhere; }
.btn-done-sm { padding: 2px 8px; font-size: 0.75rem; line-height: 1.2; }
`;

export default function DashboardPage() {
  const [data, setData] = useState<LocationGroupProc[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<LocationGroupProc[] | null>(null);

  // Стан для модалки
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{
    unitId: number,
    procId: number,
    procName: string
  } | null>(null);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get<LocationGroup[]>('/dashboard');
      const payload = res.data;

      const locationsData: LocationGroupProc[] = payload.map(locGroup => {
        const uGroups: UnitGroupProc[] = locGroup.units.map(unit => {
          const entries: DashboardEntryProc[] = unit.entries.map(getEntryProc);
          return getUnitGroupProc(unit, entries);
        });
        return getLocationGroupProc(locGroup, uGroups);
      });

      setData(locationsData);
      setSummary(filterFailedEntries(locationsData));
    } catch (e) {
      const err = e as AxiosError<{ message?: string }>;
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleOpenLogModal = (unitId: number, procId: number, procName: string) => {
    setSelectedTask({ unitId, procId, procName });
    setShowLogModal(true);
  };
  if (loading && !data) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100svh' }}>
        <Spinner animation="border" />
        <span className="ms-2">Завантаження…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-3"><Alert variant="danger">Помилка: {error}</Alert></Container>
    );
  }

  return (
    <>
      <style>{DASHBOARD_CSS}</style>
      <Container fluid className="py-3 px-2 px-sm-3">

        {/* Секція "Роботи для проведення" (Summary) */}
        {summary && summary.length > 0 && (
          <Row className="g-2 g-sm-3 mb-4">
            <Col>
              <Accordion alwaysOpen flush>
                <Accordion.Item eventKey="summary-main">
                  <Accordion.Header>
                    <div className="fw-semibold text-danger">⚠️ Потрібно виконати обслуговування</div>
                  </Accordion.Header>
                  <Accordion.Body className="p-0">
                    <ListGroup variant="flush">
                      {summary.map(l => (
                        <ListGroupItem key={l.id} className="bg-light">
                          <div className="fw-bold mb-1">{l.name}</div>
                          {l.unitsProc.map(u => (
                            <div key={u.serial} className="ms-3 mb-2">
                              <div className="small fw-semibold text-muted">{u.equipment_type} (S/N: {u.serial})</div>
                              <ListGroup className="mt-1">
                                {u.entriesProc.map(p => (
                                  <ListGroupItem key={p.procedure_name} className="d-flex justify-content-between align-items-center py-1">
                                    <div className="small">
                                      <ColoredDot status={p.status!} /> {p.procedure_name}: <strong>{p.intervalToNextStr}</strong>
                                    </div>
                                    <Button
                                      variant="outline-danger"
                                      className="btn-done-sm"
                                      onClick={() => handleOpenLogModal(p.unit_id, p.procedure_id, p.procedure_name)}
                                    >
                                      Виконати
                                    </Button>
                                  </ListGroupItem>
                                ))}
                              </ListGroup>
                            </div>
                          ))}
                        </ListGroupItem>
                      ))}
                    </ListGroup>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Col>
          </Row>
        )}

        {/* Основні картки локацій */}
        <Row xs={1} sm={1} md={2} xl={3} className="g-2 g-sm-3">
          {data?.map((loc) => (
            <Col key={loc.id}>
              <Card className="h-100 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center py-2">
                  <strong className="text-break">{loc.name}</strong>
                  <ColoredDot status={loc.status} />
                </Card.Header>
                <Card.Body className="py-2 px-1">
                  {loc.unitsProc.length === 0 ? (
                    <div className="text-muted small p-2">Обладнання відсутнє</div>
                  ) : (
                    <Accordion alwaysOpen flush>
                      {loc.unitsProc.map((u, idx) => (
                        <Accordion.Item eventKey={String(idx)} key={u.serial}>
                          <Accordion.Header>
                            <div className="d-flex flex-column">
                              <div className="d-flex align-items-center gap-2">
                                <ColoredDot status={u.status} />
                                <span className="fw-semibold small">{u.equipment_type}</span>
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.7rem' }}>S/N: {u.serial}</small>
                            </div>
                          </Accordion.Header>
                          <Accordion.Body className="p-0">
                            <ListGroup variant="flush">
                              {u.entriesProc.map((e, i) => (
                                <ListGroupItem key={i} className="py-2">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="entry-left">
                                      <div className="fw-semibold small">{e.procedure_name}</div>
                                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                        До: <span className={e.status !== 'ok' ? 'text-danger fw-bold' : ''}>{e.intervalToNextStr}</span>
                                      </div>
                                    </div>
                                    <Button
                                      variant={e.status === 'ok' ? "outline-secondary" : "outline-primary"}
                                      className="btn-done-sm mt-1"
                                      onClick={() => handleOpenLogModal(e.unit_id, e.procedure_id, e.procedure_name)}
                                    >
                                      + Лог
                                    </Button>
                                  </div>
                                </ListGroupItem>
                              ))}
                            </ListGroup>
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

      {/* Модальне вікно для додавання запису */}
      {selectedTask && (
        <AddLogEntryModal
          show={showLogModal}
          onHide={() => setShowLogModal(false)}
          onSuccess={() => {
            setShowLogModal(false);
            fetchDashboardData(true); // Оновлюємо дані без перекриття всього екрану спінером
          }}
          unitId={selectedTask.unitId}
          procedureId={selectedTask.procId}
          procedureName={selectedTask.procName}
        />
      )}
    </>
  );
}