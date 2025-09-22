import { useEffect, useRef, useState } from 'react';
import { Table, Spinner, Row, Col, Form, Button, Pagination, Modal, Container } from 'react-bootstrap';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import { getEquipmentUnits } from '../api/equipmentUnits.api';
import { getLocations } from '../api/locations.api';
import { getProcedures } from '../api/procedures.api';
import type { LogEntryDTO, LogEntryFilter, LogEntryCreate } from '../types/LogEntry';
import type { EquipmentUnitDTO } from '../types/EquipmentUnit';
import type { ProcedureDTO } from '../types/Procedure';
import type { LocationDTO } from '../types/Location';
import { addLogEntry, deleteLogEntry, getLogEntries } from '../api/logEntries.api';
import { useAuth } from '../auth/AuthProvider';
import { Trash } from 'react-bootstrap-icons';
import ConfirmModal from '../components/ConfirmModal';

const LogEntriesPage = () => {
  const { user } = useAuth();

  const addBtnRef = useRef<HTMLButtonElement>(null);

  const [entries, setEntries] = useState<LogEntryDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<LogEntryFilter>({ page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(false);

  const [units, setUnits] = useState<EquipmentUnitDTO[]>([]);
  const [procedures, setProcedures] = useState<ProcedureDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [modalLocation, setModalLocation] = useState<LocationDTO | undefined>(undefined);
  const [modalUnit, setModalUnit] = useState<EquipmentUnitDTO | undefined>(undefined);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState<LogEntryCreate>({
    date: dayjs().format('YYYY-MM-DD'),
    hours: null,
    procedureId: 0,
    unitId: 0,
    userId: 0,
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<LogEntryDTO | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await getLogEntries(filters);
      setEntries(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error('Помилка завантаження журналу');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    addBtnRef.current?.focus()
  }, [filters]);

  useEffect(() => {
    getEquipmentUnits().then((res) => setUnits(res.data));
    getProcedures().then((res) => setProcedures(res.data));
    getLocations().then((res) => {
      const data = res.data;
      data.sort((a, b) => a.name.localeCompare(b.name))
      setLocations(data)
    });
    addBtnRef.current?.focus();
  }, []);

  const handleFilterChange = (key: keyof LogEntryFilter, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSubmit = async () => {
    try {
      await addLogEntry(newEntry);
      toast.success('Запис додано');
    } catch {
      toast.error('Помилка при додаванні');
    } finally {
      setModalLocation(undefined);
      setModalUnit(undefined);
      setNewEntry({
        date: dayjs().format('YYYY-MM-DD'),
        hours: null,
        procedureId: 0,
        unitId: 0,
        userId: 0,
      });
      setShowAddModal(false);
      setFilters({ ...filters });
      fetchData(); // Refresh entries after adding
      addBtnRef.current?.focus();
    }
  };

  const requestDelete = (entry: LogEntryDTO) => {
    setEntryToDelete(entry);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;

    try {
      await deleteLogEntry(entryToDelete.id);
      toast.success('Запис видалено');
      fetchData();
    } catch (error) {
      console.error('Delete failed', error);
      toast.error('Помилка видалення запису');
    } finally {
      setShowConfirm(false);
      setEntryToDelete(null);
      addBtnRef.current?.focus();
    }
  };

  return (
    <div style={{ overflow: 'hidden' }}>
      <Container>
        <ToastContainer />
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Журнал обслуговування</h4>
          <Button ref={addBtnRef} onClick={() => setShowAddModal(true)} className="mb-3">
            Додати запис
          </Button>
        </div>
        <Row className="mb-3">
          <Col md>
            <Form.Group>
              <Form.Label>Техніка</Form.Label>
              <Form.Select
                value={filters.locationId ?? ''}
                onChange={(e) => handleFilterChange('locationId', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Вся техніка</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md>
            <Form.Group>
              <Form.Label>Обладнання</Form.Label>

              <Form.Select
                value={filters.unitId ?? ''}
                onChange={(e) => handleFilterChange('unitId', e.target.value || undefined)}
              >
                <option value="">Все обладнання</option>
                {filters.locationId
                  ? units
                    .filter((u) => u.location.id == filters.locationId)
                    .map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.equipmentType.name} S/n:{unit.serial}
                      </option>
                    ))
                  : units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.equipmentType.name} S/n:{unit.serial}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md>
            <Form.Group>
              <Form.Label>Процедури</Form.Label>

              <Form.Select
                value={filters.procedureId ?? ''}
                onChange={(e) => handleFilterChange('procedureId', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Всі процедури</option>
                {filters.unitId
                  ? procedures
                    .filter((p) => {
                      const u = units.find((u) => u.id == filters.unitId);
                      return p.equipmentType.id === u?.equipmentType.id;
                    })
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))
                  : procedures.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md>
            <Form.Group>
              <Form.Label>Від дати</Form.Label>
              <Form.Control
                type="date"
                value={filters.fromDate ?? ''}
                onChange={(e) => handleFilterChange('fromDate', e.target.value || undefined)}
              />
            </Form.Group>
          </Col>
          <Col md>
            <Form.Group>
              <Form.Label>До дати</Form.Label>
              <Form.Control
                type="date"
                value={filters.toDate ?? ''}
                onChange={(e) => handleFilterChange('toDate', e.target.value || undefined)}
              />
            </Form.Group>
          </Col>
          {/* <Col md="auto">
            <Button variant="outline-secondary" onClick={fetchData}>
              Застосувати
            </Button>
          </Col> */}
        </Row>

        {loading ? (
          <Spinner animation="border" />
        ) : (
          <>
            <div className="table-responsive">
              <Table bordered hover className="table-sm">
                <thead>
                  <tr>
                    <th>Техніка</th>
                    <th>Обладнання</th>
                    <th>Процедура</th>
                    <th>Дата</th>
                    <th>Мотогодини</th>
                    {user?.role === 'admin' && <th>Дії</th>}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.unit.location.name}</td>
                      <td>
                        {entry.unit.equipmentType.name} S/n:{entry.unit.serial}
                      </td>
                      <td>{entry.procedure.name}</td>
                      <td>{dayjs(entry.date).format('YYYY-MM-DD')}</td>
                      <td>{entry.hours ?? '—'}</td>
                      {user?.role === 'admin' && (
                        <td>
                          <Button size="sm" variant="danger" onClick={() => requestDelete(entry)}>
                            <Trash />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* <Pagination>
              {[...Array(totalPages)].map((_, i) => (
                <Pagination.Item
                  key={i + 1}
                  active={i + 1 === filters.page}
                  onClick={() => setFilters((prev) => ({ ...prev, page: i + 1 }))}
                >
                  {i + 1}
                </Pagination.Item>
              ))}
            </Pagination> */}

            {total > filters.pageSize! && (
              <div className="d-flex justify-content-center mt-3">
                <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
                  <div style={{ minWidth: 'fit-content' }}>
                    <Pagination className="mb-0 flex-wrap justify-content-center">
                      {filters.page! > 1 && (
                        <Pagination.Prev onClick={() => setFilters((prev) => ({ ...prev, page: prev.page! - 1 }))} />
                      )}

                      {(() => {
                        const pageCount = Math.ceil(total / filters.pageSize!);
                        const visiblePages = 10;
                        let start = Math.max(1, filters.page! - Math.floor(visiblePages / 2));
                        let end = start + visiblePages - 1;

                        if (end > pageCount) {
                          end = pageCount;
                          start = Math.max(1, end - visiblePages + 1);
                        }

                        return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((pageNum) => (
                          <Pagination.Item
                            key={pageNum}
                            active={pageNum === filters.page}
                            onClick={() => setFilters((prev) => ({ ...prev, page: pageNum }))}
                          >
                            {pageNum}
                          </Pagination.Item>
                        ));
                      })()}

                      {filters.page! < Math.ceil(total / filters.pageSize!) && (
                        <Pagination.Next onClick={() => setFilters((prev) => ({ ...prev, page: prev.page! + 1 }))} />
                      )}
                    </Pagination>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <Modal
          show={showAddModal}
          onHide={() => {
            setModalLocation(undefined);
            setModalUnit(undefined);
            setNewEntry({
              date: dayjs().format('YYYY-MM-DD'),
              hours: null,
              procedureId: 0,
              unitId: 0,
              userId: 0,
            });
            setShowAddModal(false);
            setFilters({ ...filters });
          }}
        >
          <Form onSubmit={handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>Новий запис</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-2">
                <Form.Label>Техніка</Form.Label>
                <Form.Select
                  value={modalLocation?.id}
                  onChange={(e) => {
                    console.log(e.target.value);
                    setModalLocation(locations.find((l) => String(l.id) === e.target.value));
                  }}
                >
                  <option>Виберіть техніку</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Обладнання</Form.Label>
                <Form.Select
                  value={newEntry.unitId}
                  onChange={(e) => {
                    setNewEntry({ ...newEntry, unitId: Number(e.target.value) });
                    setModalUnit(units.find((u) => String(u.id) === e.target.value));
                  }}
                >
                  <option>Оберіть обладнання</option>
                  {modalLocation?.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.equipmentType.name} S/n:{u.serial}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Процедура</Form.Label>
                <Form.Select
                  value={newEntry.procedureId}
                  onChange={(e) => setNewEntry({ ...newEntry, procedureId: Number(e.target.value) })}
                >
                  <option>Оберіть процедуру</option>
                  {procedures
                    .filter((p) => p.equipmentType.id === modalUnit?.equipmentType.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Дата</Form.Label>
                <Form.Control
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Години</Form.Label>
                <Form.Control
                  type="number"
                  value={newEntry.hours ?? ''}
                  onChange={(e) => setNewEntry({ ...newEntry, hours: e.target.value ? Number(e.target.value) : null })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setModalLocation(undefined);
                  setModalUnit(undefined);
                  setNewEntry({
                    date: dayjs().format('YYYY-MM-DD'),
                    hours: null,
                    procedureId: 0,
                    unitId: 0,
                    userId: 0,
                  });
                  setShowAddModal(false);
                  setFilters({ ...filters });
                }}
              >
                Скасувати
              </Button>
              <Button variant="primary" type="submit">
                Додати
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
      <ConfirmModal
        show={showConfirm}
        message={`Ви впевнені що хочете видалити запис про ${entryToDelete?.procedure.name} за ${entryToDelete?.date}?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setEntryToDelete(null);
        }}
      />
    </div >
  );
};

export default LogEntriesPage;
