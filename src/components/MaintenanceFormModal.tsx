import { useState, useEffect } from 'react';
import { Modal, Form, Row, Col, Button } from 'react-bootstrap';
import dayjs from 'dayjs';
import { Tools, CheckCircleFill } from 'react-bootstrap-icons';
import { ImageUploader } from './ImageUploader';
import { addMaintenanceLog, updateMaintenanceLog } from '../api/maintenance.api';
import { toast } from 'react-toastify';

interface MaintenanceFormModalProps {
    show: boolean;
    onHide: () => void;
    onSuccess: () => void;
    locations: any[];
    allFaults: any[];
    editData?: any | null;
    predefinedUnitId?: number;
    predefinedFaultId?: number;
    predefinedLocationId?: number;
}

export const MaintenanceFormModal = ({
    show, onHide, onSuccess, locations, allFaults, editData,
    predefinedUnitId, predefinedFaultId, predefinedLocationId
}: MaintenanceFormModalProps) => {

    const [modalLocation, setModalLocation] = useState<any>(undefined);
    const [selectedUnitId, setSelectedUnitId] = useState<number>(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isResolving, setIsResolving] = useState<boolean>(false); // ← Прапорець закриття

    const [newLog, setNewLog] = useState({
        date: dayjs().format('YYYY-MM-DD'),
        hours: '',
        workDone: '',
        comment: '',
        faultId: ''
    });

    useEffect(() => {
        if (show && editData) {
            const loc = locations.find(l => l.units?.some((u: any) => Number(u.id) === Number(editData.unitId)));
            setModalLocation(loc);
            setSelectedUnitId(editData.unitId);
            setNewLog({
                date: dayjs(editData.date).format('YYYY-MM-DD'),
                hours: editData.hours || '',
                workDone: editData.workDone || '',
                comment: editData.comment || '',
                faultId: editData.faultId ? String(editData.faultId) : ''
            });
            setIsResolving(false);
        } else if (show) {
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
            setSelectedFile(null);
            setIsResolving(false);
            setNewLog({
                date: dayjs().format('YYYY-MM-DD'),
                hours: '',
                workDone: '',
                comment: '',
                faultId: ''
            });
        }
    }, [show, editData, predefinedLocationId, predefinedUnitId, predefinedFaultId, locations]);

    // Для списку вибору: незакриті несправності + поточна (якщо редагуємо запис)
    const availableFaultsForUnit = allFaults.filter(f =>
        Number(f.unitId) === Number(selectedUnitId) &&
        (!f.isResolved || String(f.id) === newLog.faultId)
    );

    const handleFaultSelect = (faultIdVal: string) => {
        setNewLog(prev => ({ ...prev, faultId: faultIdVal }));
        if (!faultIdVal) {
            setIsResolving(false); // Якщо відв'язали дефектовку — знімаємо галочку закриття
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUnitId) {
            toast.warn('Оберіть обладнання');
            return;
        }

        const formData = new FormData();
        formData.append('unitId', String(selectedUnitId));
        formData.append('date', newLog.date);
        formData.append('workDone', newLog.workDone);
        if (newLog.hours) formData.append('hours', newLog.hours);
        if (newLog.comment) formData.append('comment', newLog.comment);
        if (newLog.faultId) formData.append('faultId', newLog.faultId);

        // Відправляємо прапорець закриття
        formData.append('isResolving', String(isResolving));

        if (selectedFile) formData.append('photo', selectedFile);

        try {
            if (editData) {
                await updateMaintenanceLog(editData.id, formData);
                toast.success('Запис оновлено');
            } else {
                await addMaintenanceLog(formData);
                toast.success(isResolving ? 'Запис додано, поломку закрито!' : 'Запис про ремонт додано');
            }

            onSuccess();
            onHide();
        } catch (err) {
            console.error(err);
            toast.error('Помилка збереження');
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static">
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{editData ? 'Редагування запису' : 'Фіксація проведених робіт'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-bold small">Техніка *</Form.Label>
                                <Form.Select
                                    required
                                    value={modalLocation?.id || ''}
                                    onChange={(e) => {
                                        const loc = locations.find(l => String(l.id) === e.target.value);
                                        setModalLocation(loc);
                                        setSelectedUnitId(0);
                                        setNewLog(prev => ({ ...prev, faultId: '' }));
                                    }}
                                >
                                    <option value="">Оберіть техніку</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-bold small">Обладнання *</Form.Label>
                                <Form.Select
                                    required
                                    value={selectedUnitId || ''}
                                    disabled={!modalLocation}
                                    onChange={(e) => {
                                        setSelectedUnitId(Number(e.target.value));
                                        setNewLog(prev => ({ ...prev, faultId: '' }));
                                    }}
                                >
                                    <option value="">Оберіть обладнання</option>
                                    {modalLocation?.units?.map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.equipmentType.name} (S/N: {u.serial})</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Прив'язка до поломки */}
                    <Form.Group className="mb-3 border p-2 rounded bg-light">
                        <Form.Label className="fw-bold text-primary small">
                            <Tools className="me-1" /> Прив'язати до несправності (Дефектовки)
                        </Form.Label>
                        <Form.Select
                            value={newLog.faultId}
                            disabled={!selectedUnitId || availableFaultsForUnit.length === 0}
                            onChange={(e) => handleFaultSelect(e.target.value)}
                        >
                            <option value="">-- Планове ТО / Ремонт без прив'язки до дефектовки --</option>
                            {availableFaultsForUnit.map(f => (
                                <option key={f.id} value={f.id}>
                                    [{dayjs(f.reportDate).format('DD.MM')}] #{f.id}: {f.description.substring(0, 50)}...
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    {/* Галочка фінального закриття — показуємо лише якщо вибрана несправність */}
                    {newLog.faultId !== '' && (
                        <div className="p-3 mb-3 rounded bg-success-subtle border border-success">
                            <Form.Check
                                type="checkbox"
                                id="isResolvingCheck"
                                label={
                                    <span className="fw-bold text-success-emphasis">
                                        <CheckCircleFill className="me-1" />
                                        Ця робота остаточно усунула несправність (закрити дефектовку)
                                    </span>
                                }
                                checked={isResolving}
                                onChange={(e) => setIsResolving(e.target.checked)}
                            />
                            <Form.Text className="text-muted d-block ms-4 small">
                                Якщо галочку не ставити — робота збережеться як проміжний етап у хронології, а дефектовка залишиться активною.
                            </Form.Text>
                        </div>
                    )}

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-bold small">Дата виконання робіт *</Form.Label>
                                <Form.Control
                                    type="date"
                                    required
                                    value={newLog.date}
                                    max={dayjs().format('YYYY-MM-DD')}
                                    onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-bold small">Напрацювання (мотогодини)</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.1"
                                    placeholder="Напр: 125.5"
                                    value={newLog.hours}
                                    onChange={(e) => setNewLog({ ...newLog, hours: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small">Опис виконаних робіт *</Form.Label>
                        <Form.Control
                            as="textarea" rows={3} required
                            placeholder="Опишіть проведені маніпуляції, замінені деталі тощо..."
                            value={newLog.workDone}
                            onChange={(e) => setNewLog({ ...newLog, workDone: e.target.value })}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small">Коментар / Примітки</Form.Label>
                        <Form.Control
                            as="textarea" rows={2}
                            placeholder="Додаткові зауваження або рекомендації..."
                            value={newLog.comment}
                            onChange={(e) => setNewLog({ ...newLog, comment: e.target.value })}
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