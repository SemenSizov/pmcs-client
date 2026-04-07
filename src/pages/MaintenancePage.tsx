import { useEffect, useState } from 'react';
import { Table, Spinner, Button, Container, Image, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import { getEquipmentUnits } from '../api/equipmentUnits.api';
import { getLocations } from '../api/locations.api';
import { deleteMaintenanceLog, getMaintenanceLogs } from '../api/maintenance.api';
import { getFaults } from '../api/faults.api';
import { Tools, Camera, Link45deg, PencilSquare, Trash } from 'react-bootstrap-icons';
import { MaintenanceFormModal } from '../components/MaintenanceFormModal'; // Наш новий компонент
import type { EquipmentUnitDTO } from '../types/EquipmentUnit';
import type { LocationDTO } from '../types/Location';
import type { MaintenanceLog } from '../types/Maintenance';
import type { Fault } from '../types/Fault';
import ConfirmModal from '../components/ConfirmModal';

const MaintenancePage = () => {
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [units, setUnits] = useState<EquipmentUnitDTO[]>([]);
    const [locations, setLocations] = useState<LocationDTO[]>([]);
    const [allFaults, setAllFaults] = useState<Fault[]>([]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [editLog, setEditLog] = useState<any | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | null>(null);
    const [filterLocationId, setFilterLocationId] = useState<number | undefined>(undefined);
    const [filterUnitId, setFilterUnitId] = useState<number | undefined>(undefined);


    const filteredLogs = logs.filter(log => {
        const unit = units.find(u => Number(u.id) === Number(log.unitId));

        // Якщо обрана техніка, але юніт запису належить іншій техніці — пропускаємо
        if (filterLocationId && unit?.location.id !== filterLocationId) return false;

        // Якщо обране конкретне обладнання, але запис про інше — пропускаємо
        if (filterUnitId && Number(log.unitId) !== filterUnitId) return false;

        return true;
    });

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


    const confirmDelete = (id: number) => {
        setIdToDelete(id);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!idToDelete) return;
        try {
            await deleteMaintenanceLog(idToDelete);
            toast.success('Запис видалено');
            fetchData(); // Оновлюємо список
        } catch (err) {
            toast.error('Помилка при видаленні');
        } finally {
            setShowDeleteModal(false);
            setIdToDelete(null);
        }
    };

    useEffect(() => { fetchData(); }, []);

    return (
        <Container>
            <ToastContainer />
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Проведені роботи та ремонти</h4>
                <Button onClick={() => setShowAddModal(true)} variant="primary">
                    <Tools className="me-2" /> Додати звіт
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
                            <th>Виконана робота</th>
                            <th>Мотогодини</th>
                            <th>Пов'язана поломка</th>
                            <th>Фото</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => {
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
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button size="sm" variant="outline-primary" onClick={() => {
                                                    setEditLog(log);
                                                    setShowAddModal(true);
                                                }}>
                                                    <PencilSquare />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => confirmDelete(log.id)}
                                                    className="ms-1"
                                                >
                                                    <Trash />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })) : (
                            <tr>
                                <td colSpan={6} className="text-center text-muted py-3">
                                    Записів про роботи за обраними фільтрами не знайдено
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            )}

            {/* ОСЬ ВІН — наш уніфікований компонент */}
            <MaintenanceFormModal
                show={showAddModal}
                onHide={() => {
                    setShowAddModal(false);
                    setEditLog(null); // Важливо скидати після закриття
                }}
                editData={editLog}
                onSuccess={fetchData} // Після успішного додавання оновлюємо таблицю
                locations={locations}
                allFaults={allFaults}
            />

            {/* Модалка перегляду фото залишається тут, бо вона специфічна для таблиці */}
            <Modal show={!!previewImage} onHide={() => setPreviewImage(null)} centered size="lg">
                <Modal.Body className="p-0 text-center">
                    <Image src={`data:image/jpeg;base64,${previewImage}`} fluid className="rounded" />
                    <Button variant="dark" className="m-2" onClick={() => setPreviewImage(null)}>Закрити</Button>
                </Modal.Body>
            </Modal>

            <ConfirmModal
                show={showDeleteModal}
                title="Видалення запису"
                message="Ви впевнені, що хочете видалити цей звіт про роботу? Цю дію неможливо скасувати."
                onConfirm={handleConfirmDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
        </Container>
    );
};

export default MaintenancePage;