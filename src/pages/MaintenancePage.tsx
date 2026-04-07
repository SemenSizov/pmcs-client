import { useEffect, useState } from 'react';
import { Table, Spinner, Button, Container, Image, Badge, Modal } from 'react-bootstrap';
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

const MaintenancePage = () => {
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [units, setUnits] = useState<EquipmentUnitDTO[]>([]);
    const [locations, setLocations] = useState<LocationDTO[]>([]);
    const [allFaults, setAllFaults] = useState<Fault[]>([]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [editLog, setEditLog] = useState<any | null>(null);

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

    const handleDelete = async (id: number) => {
        if (window.confirm('Ви впевнені, що хочете видалити цей запис?')) {
            try {
                await deleteMaintenanceLog(id);
                toast.success('Запис видалено');
                fetchData();
            } catch (err) {
                toast.error('Не вдалося видалити');
            }
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
                                    <td>
                                        <div className="d-flex gap-2">
                                            <Button size="sm" variant="outline-primary" onClick={() => {
                                                setEditLog(log);
                                                setShowAddModal(true);
                                            }}>
                                                <PencilSquare />
                                            </Button>
                                            <Button size="sm" variant="outline-danger" onClick={() => handleDelete(log.id)}>
                                                <Trash />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
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
        </Container>
    );
};

export default MaintenancePage;