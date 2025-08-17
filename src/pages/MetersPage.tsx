import { useEffect, useState } from 'react';
import { Button, Modal, Form, Table, Spinner, Row, Col, Pagination, Container } from 'react-bootstrap';
import dayjs from 'dayjs';
import { getMeterReadings, addMeterReading, getLastReading } from '../api/meterReadings.api';
import type { MeterReading } from '../types/MeterReading';
import { toast, ToastContainer } from 'react-toastify';
import { getLocations } from '../api/locations.api';
import { getEquipmentUnits } from '../api/equipmentUnits.api';
import type { EquipmentUnitDTO } from '../types/EquipmentUnit';
import type { LocationDTO } from '../types/Location';

export default function MetersPage() {
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [units, setUnits] = useState<EquipmentUnitDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [total, setTotal] = useState(0);
  const [lastReading, setLastReading] = useState<{ hours: number; date: string | null }>({
    hours: 0,
    date: null,
  });

  const fetchLastReading = async (unitId: string) => {
    try {
      const res = await getLastReading(unitId);
      setLastReading(res.data);
    } catch {
      setLastReading({ hours: 0, date: null });
    }
  };

  const [filters, setFilters] = useState({
    location_id: '',
    unit_id: '',
    from_date: '',
    to_date: '',
    page: 1,
    pageSize: 20,
  });

  const [formData, setFormData] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    location_id: '',
    unit_id: '',
    hours: '',
  });

  useEffect(() => {
    if (formData.unit_id) {
      fetchLastReading(formData.unit_id);
    }
  }, [formData.unit_id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiFilters = {
        unitId: filters.unit_id ? Number(filters.unit_id) : undefined,
        locationId: filters.location_id || undefined,
        fromDate: filters.from_date || undefined,
        toDate: filters.to_date || undefined,
        page: filters.page,
        pageSize: filters.pageSize,
      };
      const res = await getMeterReadings(apiFilters);
      setReadings(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Помилка завантаження показників');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    getLocations().then((res) => setLocations(res.data));
    getEquipmentUnits().then((res) => setUnits(res.data));
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilterChange = (e: any) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (Number(formData.hours) < lastReading.hours) {
        toast.error(`Нове значення (${formData.hours}) менше за останнє (${lastReading.hours})`);
        return;
      }
      await addMeterReading({
        ...formData,
        hours: Number(formData.hours),
        location_id: Number(formData.location_id),
        unitId: Number(formData.unit_id),
      });
      toast.success('Додано показник');
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Помилка додавання');
    } finally {
      setFormData({
        date: dayjs().format('YYYY-MM-DD'),
        location_id: '',
        unit_id: '',
        hours: '',
      });
      setLastReading({ hours: 0, date: null });
    }
  };

  return (
    <div style={{ overflow: 'hidden' }}>
      <Container>
        <ToastContainer />
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Показники мотогодин</h4>
          <Button onClick={() => setShowModal(true)}>Додати</Button>
        </div>

        <Row className="mb-3">
          <Col md>
            <Form.Group>
              <Form.Label>Техніка</Form.Label>
              <Form.Select name="location_id" value={filters.location_id} onChange={handleFilterChange}>
                <option value="">Вся техніка</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md>
            <Form.Group>
              <Form.Label>Обладнання</Form.Label>
              <Form.Select name="unit_id" value={filters.unit_id} onChange={handleFilterChange}>
                <option value="">Все обладнання</option>
                {filters.location_id
                  ? units
                      .filter((u) => String(u.location.id) === filters.location_id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.equipmentType.name} SN:{u.serial}
                        </option>
                      ))
                  : units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.equipmentType.name} SN:{u.serial}
                      </option>
                    ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md>
            <Form.Group>
              <Form.Label>Від дати</Form.Label>
              <Form.Control type="date" name="from_date" value={filters.from_date} onChange={handleFilterChange} />
            </Form.Group>
          </Col>
          <Col md>
            <Form.Group>
              <Form.Label>До дати</Form.Label>
              <Form.Control type="date" name="to_date" value={filters.to_date} onChange={handleFilterChange} />
            </Form.Group>
          </Col>
          {/* <Col md="auto">
            <Button variant="outline-secondary" onClick={fetchData}>
              Застосувати
            </Button>
          </Col> */}
        </Row>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Table responsive bordered hover>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Техніка</th>
                <th>Обладнання</th>
                <th>Мотогодини</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r) => {
                const unit = units.find((u) => String(u.id) === String(r.unitId));
                const location = locations.find((l) => l?.id === unit?.location.id);
                return (
                  <tr key={r.id}>
                    <td>{dayjs(r.date).format('YYYY-MM-DD')}</td>
                    <td>{location?.name}</td>
                    <td>{unit ? `${unit.equipmentType.name} SN:${unit.serial}` : '—'}</td>
                    <td>{r.hours}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}

        {total > filters.pageSize && (
          <div className="d-flex justify-content-center mt-3">
            <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
              <div style={{ minWidth: 'fit-content' }}>
                <Pagination className="mb-0 flex-wrap justify-content-center">
                  {filters.page > 1 && (
                    <Pagination.Prev onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))} />
                  )}

                  {(() => {
                    const pageCount = Math.ceil(total / filters.pageSize);
                    const visiblePages = 10;
                    let start = Math.max(1, filters.page - Math.floor(visiblePages / 2));
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

                  {filters.page < Math.ceil(total / filters.pageSize) && (
                    <Pagination.Next onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))} />
                  )}
                </Pagination>
              </div>
            </div>
          </div>
        )}

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Form onSubmit={handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>Новий показник</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Дата</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Техніка</Form.Label>
                <Form.Select
                  value={formData.location_id}
                  onChange={(e) => setFormData((p) => ({ ...p, location_id: e.target.value }))}
                  required
                >
                  <option value="" disabled>
                    Оберіть техніку
                  </option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Обладнання</Form.Label>
                <Form.Select
                  value={formData.unit_id}
                  onChange={(e) => setFormData((p) => ({ ...p, unit_id: e.target.value }))}
                  required
                >
                  <option value="" disabled>
                    Оберіть обладнання
                  </option>
                  {units
                    .filter((u) => String(u.location.id) === formData.location_id && u.equipmentType.hasHourmeter)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.equipmentType.name} SN:{u.serial}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Мотогодини</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={formData.hours}
                  onChange={(e) => setFormData((p) => ({ ...p, hours: e.target.value }))}
                  required
                />
                <Form.Text muted>
                  Попереднє значення: {lastReading.hours}{' '}
                  {lastReading.date ? `(${dayjs(lastReading.date).format('YYYY-MM-DD')})` : ''}
                </Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Скасувати
              </Button>
              <Button type="submit" variant="primary">
                Зберегти
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </div>
  );
}
