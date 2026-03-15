import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { addLogEntry } from '../api/logEntries.api';
import type { LogEntryCreate } from '../types/LogEntry';
import { useAuth } from '../auth/AuthProvider';

interface AddLogEntryModalProps {
    show: boolean;
    onHide: () => void;
    onSuccess: () => void;
    // Передаємо конкретні ID та назву для відображення
    unitId: number;
    procedureId: number;
    procedureName: string;
}

export default function AddLogEntryModal({
    show,
    onHide,
    onSuccess,
    unitId,
    procedureId,
    procedureName
}: AddLogEntryModalProps) {
    const { user } = useAuth();

    const [newEntry, setNewEntry] = useState<LogEntryCreate>({
        date: dayjs().format('YYYY-MM-DD'),
        hours: null,
        procedureId: procedureId,
        unitId: unitId,
        userId: user?.id || 0,
    });

    // Оновлюємо стейт, коли пропси змінюються (при відкритті для іншої процедури)
    useEffect(() => {
        if (show) {
            setNewEntry(prev => ({
                ...prev,
                procedureId: procedureId,
                unitId: unitId,
                date: dayjs().format('YYYY-MM-DD'),
                hours: null,
                userId: user?.id || 0
            }));
        }
    }, [show, procedureId, unitId, user?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Валідація
        if (!newEntry.procedureId || !newEntry.unitId) {
            toast.error('Недостатньо даних для збереження');
            return;
        }

        try {
            await addLogEntry(newEntry);
            toast.success('Запис додано');
            onSuccess();
        } catch (err) {
            toast.error('Помилка при збереженні');
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Виконання процедури</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <small className="text-muted d-block">Процедура:</small>
                        <strong className="fs-5">{procedureName}</strong>
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label>Дата</Form.Label>
                        <Form.Control
                            type="date"
                            value={newEntry.date}
                            onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Поточні мотогодини</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="Залиште порожнім, якщо не потрібно"
                            value={newEntry.hours ?? ''}
                            onChange={(e) => setNewEntry({
                                ...newEntry,
                                hours: e.target.value ? Number(e.target.value) : null
                            })}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Скасувати</Button>
                    <Button variant="primary" type="submit">Зберегти лог</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}