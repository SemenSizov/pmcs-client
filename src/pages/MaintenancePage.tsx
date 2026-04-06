import { useEffect, useState } from 'react';
import { Table, Spinner, Row, Col, Form, Button, Modal, Container, Image, Badge } from 'react-bootstrap';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import { getEquipmentUnits } from '../api/equipmentUnits.api';
import { getLocations } from '../api/locations.api';
import { getMaintenanceLogs, addMaintenanceLog } from '../api/maintenance.api';
import { getFaults } from '../api/faults.api';
import { ImageUploader } from '../components/ImageUploader';
import { Tools, Camera, Link45deg, CalendarCheck } from 'react-bootstrap-icons';
import type { EquipmentUnitDTO } from '../types/EquipmentUnit';
import type { LocationDTO } from '../types/Location';
import type { MaintenanceLog } from '../types/Maintenance';
import type { Fault } from '../types/Fault';

const MaintenancePage = () => {
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [units, setUnits] = useState<EquipmentUnitDTO[]>([]);
    const [locations, setLocations] = useState<LocationDTO[]>([]);
    const [allFaults, setAllFaults] = useState<Fault[]>([]);

    // Стейт модалки
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalLocation, setModalLocation] = useState<LocationDTO | undefined>(undefined);
    const [selectedUnitId, setSelectedUnitId] = useState<number>(0);

    const [newLog, setNewLog] = useState({
        date: dayjs().format('YYYY-MM-DD'),
        hours: '',
        workDone: '',
        comment: '',
        faultId: '' // ID несправності, яку ми закриваємо
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mRes, fRes, uRes, lRes] = await Promise.all([
                getMaintenanceLogs(),
                getFaults(),
                getEquipmentUnits(),
                getLocations()
            ]);
            setLogs(mRes.data);
            setAllFaults(fRes.data);
            setUnits(uRes.data);
            setLocations(lRes.data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
        } catch (err) {
            toast.error('Помилка завантаження даних');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUnitId || !newLog.workDone) {
            toast.warn('Заповніть обов\'язкові поля');
            return;
        }

        const formData = new FormData();
        formData.append('unitId', String(selectedUnitId));
        formData.append('date', newLog.date);
        formData.append('workDone', newLog.workDone);
        if (newLog.hours) formData.append('hours', newLog.hours);
        if (newLog.comment) formData.append('comment', newLog.comment);
        if (newLog.faultId) formData.append('faultId', newLog.faultId);
        if (selectedFile) formData.append('photo', selectedFile);

        try {
            await addMaintenanceLog(formData);
            toast.success('Запис додано. Несправність закрито (якщо була обрана)');
            setShowAddModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            toast.error('Помилка при збереженні');
        }
    };

    const resetForm = () => {
        setNewLog({
            date: dayjs().format('YYYY-MM-DD'),
            hours: '',
            workDone: '',
            comment: '',
            faultId: ''
        });
        setSelectedUnitId(0);
        setModalLocation(undefined);
        setSelectedFile(null);
    };

    // Фільтрація активних несправностей для обраної техніки
    const activeFaultsForUnit = allFaults.filter(f =>
        Number(f.unitId) === Number(selectedUnitId) && !f.isResolved
    );

    return (
        <Container>
            <ToastContainer />
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Проведені роботи та ремонти</h4>
                <Button onClick={() => setShowAddModal(true)} variant="primary">
                    <Tools className="me-2" /> Додати звіт
                </Button>
            </div>

            {loading ? <Spinner animation="border" /> : (
                <Table bordered hover responsive className="table-sm">
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Обладнання</th>
                            <th>Виконана робота</th>
                            <th>Мотогодини</th>
                            <th>Пов'язана поломка</th>
                            <th>Фото</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => {
                            const unit = units.find(u => Number(u.id) === Number(log.unitId));
                            const relatedFault = allFaults.find(f => Number(f.id) === Number(log.faultId));
                            return (
                                <tr key={log.id}>
                                    <td>{dayjs(log.date).format('YYYY-MM-DD')}</td>
                                    <td>{unit ? `${unit.equipmentType.name} (S/N: ${unit.serial})` : `Unit ID: ${log.unitId}`}</td>
                                    <td>{log.workDone}</td>
                                    <td>{log.hours ?? '—'}</td>
                                    <td>
                                        {relatedFault ? (
                                            <Badge bg="info" className="text-dark">
                                                <Link45deg /> {relatedFault.description.substring(0, 20)}...
                                            </Badge>
                                        ) : <span className="text-muted small">—</span>}
                                    </td>
                                    <td>
                                        {log.photo && (
                                            <Button size="sm" variant="outline-secondary" onClick={() => setPreviewImage(log.photo as string)}>
                                                <Camera />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            )}

            {/* Модалка додавання */}
            <Modal show={showAddModal} onHide={() => { setShowAddModal(false); resetForm(); }} size="lg">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Фіксація проведених робіт</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Label>Техніка</Form.Label>
                                <Form.Select required onChange={(e) => setModalLocation(locations.find(l => String(l.id) === e.target.value))}>
                                    <option value="">Оберіть техніку</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label>Техніка</Form.Label>
                                <Form.Select
                                    required
                                    disabled={!modalLocation}
                                    onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                                >
                                    <option value="">Оберіть пристрій</option>
                                    {modalLocation?.units.map(u => (
                                        <option key={u.id} value={u.id}>{u.equipmentType.name} (S/N: {u.serial})</option>
                                    ))}
                                </Form.Select>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3 border p-2 rounded bg-light">
                            <Form.Label className="fw-bold text-primary">
                                <CalendarCheck className="me-1" /> Закрити існуючу несправність?
                            </Form.Label>
                            <Form.Select
                                disabled={!selectedUnitId || activeFaultsForUnit.length === 0}
                                value={newLog.faultId}
                                onChange={(e) => setNewLog({ ...newLog, faultId: e.target.value })}
                            >
                                <option value="">-- Робота не пов'язана з дефектовкою --</option>
                                {activeFaultsForUnit.map(f => (
                                    <option key={f.id} value={f.id}>
                                        [{dayjs(f.reportDate).format('DD.MM')}] {f.description.substring(0, 50)}...
                                    </option>
                                ))}
                            </Form.Select>
                            {selectedUnitId > 0 && activeFaultsForUnit.length === 0 && (
                                <Form.Text className="text-muted">Активних несправностей для цієї одиниці не знайдено.</Form.Text>
                            )}
                        </Form.Group>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Label>Дата проведення</Form.Label>
                                <Form.Control type="date" value={newLog.date} onChange={(e) => setNewLog({ ...newLog, date: e.target.value })} />
                            </Col>
                            <Col md={6}>
                                <Form.Label>Мотогодини (якщо актуально)</Form.Label>
                                <Form.Control type="number" value={newLog.hours} onChange={(e) => setNewLog({ ...newLog, hours: e.target.value })} />
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Опис виконаних робіт</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                required
                                placeholder="Що було зроблено, які запчастини використано..."
                                value={newLog.workDone}
                                onChange={(e) => setNewLog({ ...newLog, workDone: e.target.value })}
                            />
                        </Form.Group>

                        <ImageUploader label="Фото звіту (запчастини, результат)" onImageSelect={setSelectedFile} />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>Скасувати</Button>
                        <Button variant="primary" type="submit">Зберегти</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Перегляд фото */}
            <Modal show={!!previewImage} onHide={() => setPreviewImage(null)} centered size="lg">
                <Modal.Body className="p-0 text-center">
                    <Image src={`data:image/jpeg;base64,${previewImage}`} fluid className="rounded" />
                    <Button variant="dark" className="m-2" onClick={() => setPreviewImage(null)}>Закрити</Button>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default MaintenancePage;