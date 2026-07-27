import { useEffect, useRef, useState, useMemo } from 'react';
import { Table, Spinner, Row, Col, Form, Button, Modal, Container, Badge, Image } from 'react-bootstrap';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import { getEquipmentUnits } from '../api/equipmentUnits.api';
import { getLocations } from '../api/locations.api';
import { addFault, getFaults } from '../api/faults.api';
import { Camera, CheckCircle, ExclamationTriangle, Tools } from 'react-bootstrap-icons';
import { ImageUploader } from '../components/ImageUploader';
import type { EquipmentUnitDTO } from '../types/EquipmentUnit';
import type { LocationDTO } from '../types/Location';
import type { Fault } from '../types/Fault';
import { MaintenanceFormModal } from '../components/MaintenanceFormModal';

interface SelectedRepairData {
    faultId: number;
    unitId: number;
    locationId?: number;
}

const FaultsPage = () => {
    const addBtnRef = useRef<HTMLButtonElement>(null);

    const [faults, setFaults] = useState<Fault[]>([]);
    const [loading, setLoading] = useState(false);
    const [units, setUnits] = useState<EquipmentUnitDTO[]>([]);
    const [locations, setLocations] = useState<LocationDTO[]>([]);
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [selectedFaultForRepair, setSelectedFaultForRepair] = useState<SelectedRepairData | null>(null);

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

    // Fast O(1) lookup map для обладнання
    const unitsMap = useMemo(() => {
        const map = new Map<number, EquipmentUnitDTO>();
        units.forEach(u => map.set(Number(u.id), u));
        return map;
    }, [units]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [faultsRes, unitsRes, locationsRes] = await Promise.all([
                getFaults(),
                getEquipmentUnits(),
                getLocations()
            ]);

            setFaults(faultsRes.data);
            setUnits(unitsRes.data);
            setLocations(locationsRes.data.sort((a: LocationDTO, b: LocationDTO) => a.name.localeCompare(b.name)));
        } catch (err) {
            toast.error('Помилка завантаження даних');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // При відкритті модалки додавання підтягуємо локацію з фільтру, якщо вона обрана
    const handleOpenAddModal = () => {
        if (filterUnitId) {
            const selectedUnit = unitsMap.get(filterUnitId);
            if (selectedUnit) {
                const parentLoc = locations.find(l => l.id === selectedUnit.location?.id);
                setModalLocation(parentLoc);
                setNewFault(prev => ({
                    ...prev,
                    unitId: filterUnitId
                }));
            }
        } else if (filterLocationId) {
            const currentLoc = locations.find(l => l.id === filterLocationId);
            setModalLocation(currentLoc);
        }
        setShowAddModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFault.unitId || !newFault.description.trim()) {
            toast.warn('Заповніть всі обов\'язкові поля');
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
            toast.error('Помилка при збереженні несправності');
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
        const unit = unitsMap.get(Number(fault.unitId));
        setSelectedFaultForRepair({
            faultId: fault.id,
            unitId: fault.unitId,
            locationId: unit?.location?.id
        });
        setShowRepairModal(true);
    };

    const filteredFaults = useMemo(() => {
        return faults.filter(f => {
            const unit = unitsMap.get(Number(f.unitId));
            if (filterLocationId && unit?.location?.id !== filterLocationId) return false;
            if (filterUnitId && f.unitId !== filterUnitId) return false;
            return true;
        });
    }, [faults, unitsMap, filterLocationId, filterUnitId]);

    // Допоміжна функція для форматування src картинки
    const formatImageSrc = (photoStr: string) => {
        if (photoStr.startsWith('http') || photoStr.startsWith('data:')) {
            return photoStr;
        }
        return `data:image/jpeg;base64,${photoStr}`;
    };

    return (
        <Container fluid="lg" className="py-3">
            <ToastContainer autoClose={3000} />

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Журнал несправностей (Дефектовка)</h4>
                <Button ref={addBtnRef} onClick={handleOpenAddModal} variant="danger">
                    <ExclamationTriangle className="me-2" />
                    Зафіксувати поломку
                </Button>
            </div>

            {/* Фільтри */}
            <Row className="g-2 mb-3">
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="small fw-bold">Фільтр по техніці</Form.Label>
                        <Form.Select
                            size="sm"
                            value={filterLocationId ?? ''}
                            onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : undefined;
                                setFilterLocationId(val);
                                setFilterUnitId(undefined); // Скидаємо обладнання при зміні техніки
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
                            disabled={!filterLocationId}
                        >
                            <option value="">Все обладнання</option>
                            {units
                                .filter(u => u.location?.id === filterLocationId)
                                .map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.equipmentType.name} (S/N: {u.serial})
                                    </option>
                                ))
                            }
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            {/* Таблиця */}
            {loading ? (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <Table bordered hover responsive className="table-sm align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>Дата</th>
                            <th>Техніка</th>
                            <th>Обладнання</th>
                            <th>Опис проблеми</th>
                            <th>Статус</th>
                            <th className="text-center">Фото</th>
                            <th className="text-center">Дія</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFaults.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center text-muted py-3">
                                    Несправностей не знайдено
                                </td>
                            </tr>
                        ) : (
                            filteredFaults.map((fault) => {
                                const unit = unitsMap.get(Number(fault.unitId));
                                return (
                                    <tr key={fault.id}>
                                        <td className="text-nowrap">{dayjs(fault.reportDate).format('YYYY-MM-DD')}</td>
                                        <td>{unit?.location?.name || '-'}</td>
                                        <td>{unit ? `${unit.equipmentType.name} (S/N: ${unit.serial})` : `ID: ${fault.unitId}`}</td>
                                        <td>{fault.description}</td>
                                        <td>
                                            {fault.isResolved ? (
                                                <Badge bg="success"><CheckCircle className="me-1" /> Виправлено</Badge>
                                            ) : (
                                                <Badge bg="danger">Активна</Badge>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            {fault.reportPhoto && (
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={() => setPreviewImage(fault.reportPhoto as string)}
                                                >
                                                    <Camera />
                                                </Button>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                variant="success"
                                                size="sm"
                                                title="Усунути несправність"
                                                onClick={() => openRepairForm(fault)}
                                                disabled={fault.isResolved}
                                            >
                                                <Tools />
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </Table>
            )}

            {/* Модалка додавання */}
            <Modal show={showAddModal} onHide={() => { setShowAddModal(false); resetModal(); }} backdrop="static">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Нова несправність</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Техніка <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                                required
                                value={modalLocation?.id || ''}
                                onChange={(e) => {
                                    const selectedLoc = locations.find(l => String(l.id) === e.target.value);
                                    setModalLocation(selectedLoc);
                                    setNewFault(prev => ({ ...prev, unitId: 0 })); // Скидаємо обладнання при зміні техніки
                                }}
                            >
                                <option value="">Оберіть техніку</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Обладнання <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                                required
                                disabled={!modalLocation}
                                value={newFault.unitId || ''}
                                onChange={(e) => setNewFault({ ...newFault, unitId: Number(e.target.value) })}
                            >
                                <option value="">Оберіть обладнання</option>
                                {modalLocation?.units?.map(u => (
                                    <option key={u.id} value={u.id}>{u.equipmentType.name} (S/N: {u.serial})</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Дата виявлення</Form.Label>
                            <Form.Control
                                type="date"
                                value={newFault.reportDate}
                                onChange={(e) => setNewFault({ ...newFault, reportDate: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Опис поломки <span className="text-danger">*</span></Form.Label>
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
                        <Button variant="secondary" onClick={() => { setShowAddModal(false); resetModal(); }}>Скасувати</Button>
                        <Button variant="danger" type="submit">Зафіксувати</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Модалка для перегляду фото */}
            <Modal show={!!previewImage} onHide={() => setPreviewImage(null)} centered size="lg">
                <Modal.Header closeButton><Modal.Title>Фото несправності</Modal.Title></Modal.Header>
                <Modal.Body className="text-center">
                    {previewImage && <Image src={formatImageSrc(previewImage)} fluid rounded />}
                </Modal.Body>
            </Modal>

            {/* Модалка ремонту */}
            <MaintenanceFormModal
                show={showRepairModal}
                onHide={() => setShowRepairModal(false)}
                onSuccess={fetchData}
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