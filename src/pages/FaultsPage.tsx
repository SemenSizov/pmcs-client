import { useEffect, useRef, useState } from 'react';
import { Table, Spinner, Row, Col, Form, Button, Modal, Container, Badge, Image } from 'react-bootstrap';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import { getEquipmentUnits } from '../api/equipmentUnits.api';
import { getLocations } from '../api/locations.api';
import { addFault, getFaults } from '../api/faults.api'; // Створи ці методи в api
// import { useAuth } from '../auth/AuthProvider';
import { Camera, CheckCircle, ExclamationTriangle, Tools } from 'react-bootstrap-icons';
import { ImageUploader } from '../components/ImageUploader';
import type { EquipmentUnitDTO } from '../types/EquipmentUnit';
import type { LocationDTO } from '../types/Location';
import type { Fault } from '../types/Fault';
import { MaintenanceFormModal } from '../components/MaintenanceFormModal';

const FaultsPage = () => {
    // const { user } = useAuth();
    const addBtnRef = useRef<HTMLButtonElement>(null);

    const [faults, setFaults] = useState<Fault[]>([]);
    const [loading, setLoading] = useState(false);
    const [units, setUnits] = useState<EquipmentUnitDTO[]>([]);
    const [locations, setLocations] = useState<LocationDTO[]>([]);
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [selectedFaultForRepair, setSelectedFaultForRepair] = useState<any>(null);

    // Фільтри
    const [filterLocationId, setFilterLocationId] = useState<number | undefined>(undefined);
    const [filterUnitId, setFilterUnitId] = useState<number | undefined>(undefined);

    // Стейт для нової несправності
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalLocation, setModalLocation] = useState<LocationDTO | undefined>(undefined);
    const [newFault, setNewFault] = useState({
        unitId: 0,
        description: '',
        reportDate: dayjs().format('YYYY-MM-DD'),
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Стейт для перегляду фото
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await getFaults(); // Можна додати фільтрацію на бекенд пізніше
            setFaults(data);
        } catch (err) {
            toast.error('Помилка завантаження списку несправностей');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        getEquipmentUnits().then((res) => setUnits(res.data));
        getLocations().then((res) => setLocations(res.data.sort((a: any, b: any) => a.name.localeCompare(b.name))));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFault.unitId || !newFault.description) {
            toast.warn('Заповніть основні поля');
            return;
        }

        const formData = new FormData();
        formData.append('unitId', String(newFault.unitId));
        formData.append('description', newFault.description);
        formData.append('reportDate', newFault.reportDate);
        if (selectedFile) {
            formData.append('photo', selectedFile);
        }

        try {
            await addFault(formData);
            toast.success('Несправність зафіксовано');
            setShowAddModal(false);
            resetModal();
            fetchData();
        } catch (err) {
            toast.error('Помилка при збереженні');
        }
    };

    const resetModal = () => {
        setNewFault({
            unitId: 0,
            description: '',
            reportDate: dayjs().format('YYYY-MM-DD'),
        });
        setSelectedFile(null);
        setModalLocation(undefined);
    };

    const openRepairForm = (fault: Fault) => {
        const unit = units.find(u => Number(u.id) === Number(fault.unitId));
        setSelectedFaultForRepair({
            faultId: fault.id,
            unitId: fault.unitId,
            locationId: unit?.location.id
        });
        setShowRepairModal(true);
    };

    // Фільтрація на фронті (для простоти, як у твоїх LogEntries)
    const filteredFaults = faults.filter(f => {
        const unit = units.find(u => Number(u.id) === Number(f.unitId));
        if (filterLocationId && unit?.location.id !== filterLocationId) return false;
        if (filterUnitId && f.unitId !== filterUnitId) return false;
        return true;
    });

    return (
        <Container>
            <ToastContainer />
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Журнал несправностей (Дефектовка)</h4>
                <Button ref={addBtnRef} onClick={() => setShowAddModal(true)} variant="danger">
                    <ExclamationTriangle className="me-2" />
                    Зафіксувати поломку
                </Button>
            </div>

            <Row className="mb-3 mt-2">
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="small fw-bold">Фільтр по техніці</Form.Label>
                        <Form.Select
                            size="sm"
                            value={filterLocationId ?? ''}
                            onChange={(e) => {
                                setFilterLocationId(e.target.value ? Number(e.target.value) : undefined);
                                setFilterUnitId(undefined); // Скидаємо фільтр обладнання при зміні техніки
                            }}
                        >
                            <option value="">Вся техніка</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="small fw-bold">Фільтр по обладнанню</Form.Label>
                        <Form.Select
                            size="sm"
                            value={filterUnitId ?? ''}
                            onChange={(e) => setFilterUnitId(e.target.value ? Number(e.target.value) : undefined)}
                            disabled={!filterLocationId} // Логічно обирати обладнання тільки коли обрана техніка
                        >
                            <option value="">Все обладнання</option>
                            {units
                                .filter(u => !filterLocationId || u.location.id === filterLocationId)
                                .map(u => <option key={u.id} value={u.id}>{u.equipmentType.name} (S/N: {u.serial})</option>)
                            }
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            {loading ? <Spinner animation="border" /> : (
                <Table bordered hover responsive className="table-sm">
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Обладнання</th>
                            <th>Опис проблеми</th>
                            <th>Статус</th>
                            <th>Фото</th>
                            <th>Закрити</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFaults.map((fault) => {
                            const unit = units.find(u => Number(u.id) === Number(fault.unitId));
                            return (
                                <tr key={fault.id}>
                                    <td>{dayjs(fault.reportDate).format('YYYY-MM-DD')}</td>
                                    <td>{unit ? `${unit.equipmentType.name} (S/N: ${unit.serial})` : `ID: ${fault.unitId}`}</td>
                                    <td>{fault.description}</td>
                                    <td>
                                        {fault.isResolved ?
                                            <Badge bg="success"><CheckCircle className="me-1" /> Виправлено</Badge> :
                                            <Badge bg="danger">Активна</Badge>
                                        }
                                    </td>
                                    <td>
                                        {fault.reportPhoto && (
                                            <Button size="sm" variant="outline-primary" onClick={() => setPreviewImage(fault.reportPhoto as string)}>
                                                <Camera />
                                            </Button>
                                        )}
                                    </td>
                                    <td>
                                        <Button variant="success" size="sm" onClick={() => openRepairForm(fault)}><Tools /></Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            )}

            {/* Модалка додавання */}
            <Modal show={showAddModal} onHide={() => { setShowAddModal(false); resetModal(); }}>
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Нова несправність</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-2">
                            <Form.Label>Техніка</Form.Label>
                            <Form.Select
                                required
                                onChange={(e) => setModalLocation(locations.find(l => String(l.id) === e.target.value))}
                            >
                                <option value="">Оберіть техніку</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Обладнання</Form.Label>
                            <Form.Select
                                required
                                disabled={!modalLocation}
                                onChange={(e) => setNewFault({ ...newFault, unitId: Number(e.target.value) })}
                            >
                                <option value="">Оберіть обладнання</option>
                                {modalLocation?.units.map(u => (
                                    <option key={u.id} value={u.id}>{u.equipmentType.name} (S/N: {u.serial})</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Дата виявлення</Form.Label>
                            <Form.Control
                                type="date"
                                value={newFault.reportDate}
                                onChange={(e) => setNewFault({ ...newFault, reportDate: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Опис поломки</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                required
                                value={newFault.description}
                                onChange={(e) => setNewFault({ ...newFault, description: e.target.value })}
                            />
                        </Form.Group>

                        <ImageUploader label="Додати фото" onImageSelect={setSelectedFile} />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>Скасувати</Button>
                        <Button variant="danger" type="submit">Зафіксувати</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Модалка для перегляду фото */}
            <Modal show={!!previewImage} onHide={() => setPreviewImage(null)} centered size="lg">
                <Modal.Header closeButton><Modal.Title>Фото несправності</Modal.Title></Modal.Header>
                <Modal.Body className="text-center">
                    <Image src={`data:image/jpeg;base64,${previewImage}`} fluid rounded />
                </Modal.Body>
            </Modal>

            <MaintenanceFormModal
                show={showRepairModal}
                onHide={() => setShowRepairModal(false)}
                onSuccess={fetchData} // Щоб оновити список несправностей після ремонту
                locations={locations}
                allFaults={faults}
                predefinedFaultId={selectedFaultForRepair?.faultId}
                predefinedUnitId={selectedFaultForRepair?.unitId}
                predefinedLocationId={selectedFaultForRepair?.locationId}
            />
        </Container>
    );
};

export default FaultsPage;