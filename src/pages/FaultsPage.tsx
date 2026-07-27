// FaultsPage.tsx
import React, { useEffect, useRef, useState, useMemo, Fragment } from 'react';
import { Table, Spinner, Row, Col, Form, Button, Modal, Container, Badge, Image, Collapse, ListGroup } from 'react-bootstrap';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import { getEquipmentUnits } from '../api/equipmentUnits.api';
import { getLocations } from '../api/locations.api';
import { addFault, getFaults, updateFault } from '../api/faults.api';
import { getMaintenanceLogs } from '../api/maintenance.api';
import { Camera, CheckCircle, ExclamationTriangle, Tools, ChevronDown, ChevronUp, Wrench, Clock, PencilSquare, ArrowCounterclockwise } from 'react-bootstrap-icons';
import { ImageUploader } from '../components/ImageUploader';
import type { EquipmentUnitDTO } from '../types/EquipmentUnit';
import type { LocationDTO } from '../types/Location';
import type { Fault } from '../types/Fault';
import type { MaintenanceLog } from '../types/Maintenance';
import { MaintenanceFormModal } from '../components/MaintenanceFormModal';

interface SelectedRepairData {
    faultId: number;
    unitId: number;
    locationId?: number;
}

const FaultsPage = () => {
    const addBtnRef = useRef<HTMLButtonElement>(null);

    const [faults, setFaults] = useState<Fault[]>([]);
    const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [units, setUnits] = useState<EquipmentUnitDTO[]>([]);
    const [locations, setLocations] = useState<LocationDTO[]>([]);
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [selectedFaultForRepair, setSelectedFaultForRepair] = useState<SelectedRepairData | null>(null);

    // Стейт для розкриття логу робіт
    const [expandedFaultId, setExpandedFaultId] = useState<number | null>(null);

    // Фільтри
    const [filterLocationId, setFilterLocationId] = useState<number | undefined>(undefined);
    const [filterUnitId, setFilterUnitId] = useState<number | undefined>(undefined);

    // Стейт для модалки створення / редагування несправності
    const [showAddModal, setShowAddModal] = useState(false);
    const [editFault, setEditFault] = useState<Fault | null>(null);
    const [reopenFault, setReopenFault] = useState(false); // ← Стейт для повторного відкриття
    const [modalLocation, setModalLocation] = useState<LocationDTO | undefined>(undefined);
    const [newFault, setNewFault] = useState({
        unitId: 0,
        description: '',
        reportDate: dayjs().format('YYYY-MM-DD'),
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Стейт для перегляду фото
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const unitsMap = useMemo(() => {
        const map = new Map<number, EquipmentUnitDTO>();
        units.forEach(u => map.set(Number(u.id), u));
        return map;
    }, [units]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [faultsRes, unitsRes, locationsRes, logsRes] = await Promise.all([
                getFaults(),
                getEquipmentUnits(),
                getLocations(),
                getMaintenanceLogs()
            ]);

            setFaults(faultsRes.data);
            setUnits(unitsRes.data);
            setLocations(locationsRes.data.sort((a: LocationDTO, b: LocationDTO) => a.name.localeCompare(b.name)));
            setMaintenanceLogs(logsRes.data);
        } catch (err) {
            toast.error('Помилка завантаження даних');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenAddModal = () => {
        setEditFault(null);
        setReopenFault(false);
        if (filterUnitId) {
            const selectedUnit = unitsMap.get(filterUnitId);
            if (selectedUnit) {
                const parentLoc = locations.find(l => l.id === selectedUnit.location?.id);
                setModalLocation(parentLoc);
                setNewFault({
                    unitId: filterUnitId,
                    description: '',
                    reportDate: dayjs().format('YYYY-MM-DD'),
                });
            }
        } else if (filterLocationId) {
            const currentLoc = locations.find(l => l.id === filterLocationId);
            setModalLocation(currentLoc);
            setNewFault({
                unitId: 0,
                description: '',
                reportDate: dayjs().format('YYYY-MM-DD'),
            });
        } else {
            resetModal();
        }
        setShowAddModal(true);
    };

    // Відкриття модалки в режимі редагування
    const handleOpenEditModal = (fault: Fault) => {
        setEditFault(fault);
        setReopenFault(false); // За замовчуванням не перевідкриваємо
        const unit = unitsMap.get(Number(fault.unitId));
        if (unit) {
            const parentLoc = locations.find(l => l.id === unit.location?.id);
            setModalLocation(parentLoc);
        }
        setNewFault({
            unitId: Number(fault.unitId),
            description: fault.description,
            reportDate: dayjs(fault.reportDate).format('YYYY-MM-DD'),
        });
        setSelectedFile(null);
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

        // Передаємо прапорець перевідкриття
        if (editFault && reopenFault) {
            formData.append('isResolved', 'false');
        }

        if (selectedFile) {
            formData.append('photo', selectedFile);
        }

        setSubmitting(true);
        try {
            if (editFault) {
                await updateFault(editFault.id, formData);
                toast.success('Запис про несправність оновлено');
            } else {
                await addFault(formData);
                toast.success('Несправність зафіксовано');
            }
            setShowAddModal(false);
            resetModal();
            fetchData();
        } catch (err) {
            toast.error('Помилка при збереженні несправності');
        } finally {
            setSubmitting(false);
        }
    };

    const resetModal = () => {
        setEditFault(null);
        setReopenFault(false);
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

    const formatImageSrc = (photoStr: string) => {
        if (photoStr.startsWith('http') || photoStr.startsWith('data:')) {
            return photoStr;
        }
        return `data:image/jpeg;base64,${photoStr}`;
    };

    const toggleHistory = (faultId: number) => {
        setExpandedFaultId(prev => prev === faultId ? null : faultId);
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
                                setFilterUnitId(undefined);
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
                            <th>Історія робіт</th>
                            <th>Статус</th>
                            <th className="text-center">Фото</th>
                            <th className="text-center">Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFaults.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center text-muted py-3">
                                    Несправностей не знайдено
                                </td>
                            </tr>
                        ) : (
                            filteredFaults.map((fault) => {
                                const unit = unitsMap.get(Number(fault.unitId));
                                const relatedLogs = maintenanceLogs
                                    .filter(m => Number(m.faultId) === Number(fault.id))
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                                const isExpanded = expandedFaultId === fault.id;

                                return (
                                    <Fragment key={fault.id}>
                                        <tr>
                                            <td className="text-nowrap">{dayjs(fault.reportDate).format('YYYY-MM-DD')}</td>
                                            <td>{unit?.location?.name || '-'}</td>
                                            <td>{unit ? `${unit.equipmentType.name} (S/N: ${unit.serial})` : `ID: ${fault.unitId}`}</td>
                                            <td>{fault.description}</td>
                                            <td>
                                                <Button
                                                    size="sm"
                                                    variant={relatedLogs.length > 0 ? "outline-secondary" : "light"}
                                                    className="position-relative text-nowrap py-0 px-2"
                                                    onClick={() => toggleHistory(fault.id)}
                                                    disabled={relatedLogs.length === 0}
                                                >
                                                    <Wrench className="me-1" />
                                                    {relatedLogs.length} {relatedLogs.length === 1 ? 'запис' : 'записів'}
                                                    {relatedLogs.length > 0 && (
                                                        isExpanded ? <ChevronUp className="ms-1" /> : <ChevronDown className="ms-1" />
                                                    )}
                                                </Button>
                                            </td>
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
                                                <div className="d-flex justify-content-center gap-1">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        title="Редагувати дефектовку"
                                                        onClick={() => handleOpenEditModal(fault)}
                                                    >
                                                        <PencilSquare />
                                                    </Button>

                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        title={fault.isResolved ? "Несправність виправлена" : "Додати робочий звіт / Усунути"}
                                                        onClick={() => openRepairForm(fault)}
                                                        disabled={fault.isResolved}
                                                    >
                                                        <Tools />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>

                                        {relatedLogs.length > 0 && (
                                            <tr>
                                                <td colSpan={8} className="p-0 border-0">
                                                    <Collapse in={isExpanded}>
                                                        <div className="p-3 bg-light border-bottom">
                                                            <h6 className="small fw-bold text-dark mb-2">
                                                                <Wrench className="me-1 text-primary" />
                                                                Хронологія ремонтів та спроб усунення поломки #{fault.id}:
                                                            </h6>
                                                            <ListGroup variant="flush" className="rounded border">
                                                                {relatedLogs.map(log => (
                                                                    <ListGroup.Item key={log.id} className="small bg-white">
                                                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                                                            <span className="fw-bold text-secondary">
                                                                                <Clock className="me-1" />
                                                                                {dayjs(log.date).format('YYYY-MM-DD')}
                                                                            </span>
                                                                            {log.hours && (
                                                                                <Badge bg="secondary">{log.hours} мотогодин</Badge>
                                                                            )}
                                                                        </div>
                                                                        <div className="fw-bold text-dark">{log.workDone}</div>
                                                                        {log.comment && (
                                                                            <div className="text-muted mt-1 italic">{log.comment}</div>
                                                                        )}
                                                                    </ListGroup.Item>
                                                                ))}
                                                            </ListGroup>
                                                        </div>
                                                    </Collapse>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })
                        )}
                    </tbody>
                </Table>
            )}

            {/* Модалка створення / редагування поломки */}
            <Modal show={showAddModal} onHide={() => { setShowAddModal(false); resetModal(); }} backdrop="static">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editFault ? `Редагування дефектовки #${editFault.id}` : 'Нова несправність'}</Modal.Title>
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
                                    setNewFault(prev => ({ ...prev, unitId: 0 }));
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

                        {/* Блок перевідкриття (показується тільки якщо несправність уже виправлена) */}
                        {editFault?.isResolved && (
                            <div className="p-3 mb-3 border rounded bg-warning bg-opacity-10 border-warning">
                                <Form.Check
                                    type="checkbox"
                                    id="reopen-fault-checkbox"
                                    label={
                                        <span className="fw-bold text-dark">
                                            <ArrowCounterclockwise className="me-1 text-warning" />
                                            Відкрити несправність заново (повернути статус "Активна")
                                        </span>
                                    }
                                    checked={reopenFault}
                                    onChange={(e) => setReopenFault(e.target.checked)}
                                />
                                <div className="small text-muted mt-1 ms-4">
                                    Це скасує статус "Виправлено" та очистить звіт про рішення. Історія ремонтів залишиться збереженою.
                                </div>
                            </div>
                        )}

                        <ImageUploader label={editFault?.reportPhoto ? "Замінити фото" : "Додати фото"} onImageSelect={setSelectedFile} />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => { setShowAddModal(false); resetModal(); }}>Скасувати</Button>
                        <Button variant={editFault ? (reopenFault ? "warning" : "primary") : "danger"} type="submit" disabled={submitting}>
                            {submitting ? 'Збереження...' : (editFault ? (reopenFault ? 'Зберегти та відкрити заново' : 'Зберегти зміни') : 'Зафіксувати')}
                        </Button>
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