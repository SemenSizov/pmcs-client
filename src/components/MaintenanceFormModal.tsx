import { useState, useEffect } from 'react';
import { Modal, Form, Row, Col, Button } from 'react-bootstrap';
import dayjs from 'dayjs';
import { CalendarCheck } from 'react-bootstrap-icons';
import { ImageUploader } from './ImageUploader';
import { addMaintenanceLog } from '../api/maintenance.api';
import { toast } from 'react-toastify';

interface MaintenanceFormModalProps {
    show: boolean;
    onHide: () => void;
    onSuccess: () => void;
    locations: any[];
    allFaults: any[];
    // Оці пропси дозволять нам "прокинути" дані з FaultsPage
    predefinedUnitId?: number;
    predefinedFaultId?: number;
    predefinedLocationId?: number;
}

export const MaintenanceFormModal = ({
    show, onHide, onSuccess, locations, allFaults,
    predefinedUnitId, predefinedFaultId, predefinedLocationId
}: MaintenanceFormModalProps) => {

    const [modalLocation, setModalLocation] = useState<any>(undefined);
    const [selectedUnitId, setSelectedUnitId] = useState<number>(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [newLog, setNewLog] = useState({
        date: dayjs().format('YYYY-MM-DD'),
        hours: '',
        workDone: '',
        comment: '',
        faultId: ''
    });

    // Ефект для автозаповнення, якщо дані передані ззовні
    useEffect(() => {
        if (show) {
            if (predefinedLocationId) {
                setModalLocation(locations.find(l => l.id === predefinedLocationId));
            }
            if (predefinedUnitId) {
                setSelectedUnitId(predefinedUnitId);
            }
            if (predefinedFaultId) {
                setNewLog(prev => ({ ...prev, faultId: String(predefinedFaultId) }));
            }
        } else {
            // Скидання при закритті
            setModalLocation(undefined);
            setSelectedUnitId(0);
            setNewLog({
                date: dayjs().format('YYYY-MM-DD'),
                hours: '',
                workDone: '',
                comment: '',
                faultId: ''
            });
        }
    }, [show, predefinedLocationId, predefinedUnitId, predefinedFaultId, locations]);

    const activeFaultsForUnit = allFaults.filter(f =>
        Number(f.unitId) === Number(selectedUnitId) && !f.isResolved
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('unitId', String(selectedUnitId));
        formData.append('date', newLog.date);
        formData.append('workDone', newLog.workDone);
        if (newLog.hours) formData.append('hours', newLog.hours);
        if (newLog.faultId) formData.append('faultId', newLog.faultId);
        if (selectedFile) formData.append('photo', selectedFile);

        try {
            await addMaintenanceLog(formData);
            toast.success('Ремонт зафіксовано');
            onSuccess();
            onHide();
        } catch (err) {
            toast.error('Помилка збереження');
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Фіксація проведених робіт</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Label>Техніка</Form.Label>
                            <Form.Select
                                required
                                value={modalLocation?.id || ''}
                                onChange={(e) => setModalLocation(locations.find(l => String(l.id) === e.target.value))}
                            >
                                <option value="">Оберіть техніку</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>Обладнання</Form.Label>
                            <Form.Select
                                required
                                value={selectedUnitId || ''}
                                disabled={!modalLocation}
                                onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                            >
                                <option value="">Оберіть обладнання</option>
                                {modalLocation?.units.map((u: any) => (
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
                            value={newLog.faultId}
                            disabled={!selectedUnitId || activeFaultsForUnit.length === 0}
                            onChange={(e) => setNewLog({ ...newLog, faultId: e.target.value })}
                        >
                            <option value="">-- Робота не пов'язана з дефектовкою --</option>
                            {activeFaultsForUnit.map(f => (
                                <option key={f.id} value={f.id}>
                                    [{dayjs(f.reportDate).format('DD.MM')}] {f.description.substring(0, 50)}...
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Опис виконаних робіт</Form.Label>
                        <Form.Control
                            as="textarea" rows={3} required
                            value={newLog.workDone}
                            onChange={(e) => setNewLog({ ...newLog, workDone: e.target.value })}
                        />
                    </Form.Group>

                    <ImageUploader label="Фото звіту" onImageSelect={setSelectedFile} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Скасувати</Button>
                    <Button variant="primary" type="submit">Зберегти</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};