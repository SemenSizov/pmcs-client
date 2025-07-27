import { useEffect, useState } from 'react';
import { Button, Modal, Form, Table, Spinner, Row, Col, Pagination } from 'react-bootstrap';
import dayjs from 'dayjs';
import { getMeterReadings, addMeterReading } from '../api/meterReadings.api';
import type { MeterReading } from '../types/MeterReading';
import { toast } from 'react-toastify';
import { getLocations } from '../api/locations.api';
import { getEquipmentUnits } from '../api/equipmentUnits.api';

export default function MetersPage() {
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    location_id: '',
    unit_id: '',
    date: '',
  });

  const [formData, setFormData] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    location_id: '',
    unit_id: '',
    hours: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMeterReadings(filters);
      setReadings(res.data);
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

  const handleFilterChange = (e: any) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await addMeterReading({
        ...formData,
        hours: Number(formData.hours),
        location_id: Number(formData.location_id),
        unit_id: Number(formData.unit_id),
      });
      toast.success('Додано показник');
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Помилка додавання');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Показники мотогодин</h4>
        <Button onClick={() => setShowModal(true)}>Додати</Button>
      </div>

      <Row className="mb-3">
        <Col md>
          <Form.Select name="location_id" value={filters.location_id} onChange={handleFilterChange}>
            <option value="">Всі локації</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md>
          <Form.Select name="unit_id" value={filters.unit_id} onChange={handleFilterChange}>
            <option value="">Всі одиниці</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md>
          <Form.Control type="date" name="date" value={filters.date} onChange={handleFilterChange} />
        </Col>
        <Col md="auto">
          <Button variant="outline-secondary" onClick={fetchData}>
            Застосувати
          </Button>
        </Col>
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
              <th>Одиниця</th>
              <th>Мотогодини</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r) => (
              <tr key={r.id}>
                <td>{dayjs(r.date).format('YYYY-MM-DD')}</td>
                <td>{r.location.name}</td>
                <td>{r.unit.name}</td>
                <td>{r.hours}</td>
              </tr>
            ))}
          </tbody>
        </Table>
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
                <option value="">Оберіть техніку</option>
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
                <option value="">Оберіть обладнання</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
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
    </div>
  );
}
