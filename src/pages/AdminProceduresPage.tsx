import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import api from '../api/api';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-toastify';

interface Procedure {
  id: number;
  name: string;
  type: 'hours' | 'period';
  hours?: number;
  period?: string;
  unit_type_id: number;
}

interface ProcedureDTO {
  id: number;
  name: string;
  type: 'hours' | 'period';
  hours?: number;
  period?: 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  unitType: {
    id: number;
    name: string;
  };
}

interface UnitType {
  id: number;
  name: string;
}

const periodMapping = {
  weekly: "Щотижня",
  monthly: "Щомісяця",
  quarterly: "Щокварталу",
  semiannual: "Раз на півроку",
  annual: "Щороку"
}

export default function AdminProceduresPage() {
  const [types, setTypes] = useState<UnitType[]>([]);
  const [procedures, setProcedures] = useState<ProcedureDTO[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureDTO | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<ProcedureDTO | null>(null);
  const [periodicityType, setPeriodicityType] = useState<'period' | 'hours'>('period');
  const [periodValue, setPeriodValue] = useState('');
  const [engineHours, setEngineHours] = useState('');

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodicityType(e.target.value as 'period' | 'hours');
    setPeriodValue('');
    setEngineHours('');
  };

  const fetchProcedures = () => {
    api
      .get('/procedures')
      .then((res) => setProcedures(res.data))
      .catch((err) => console.error(err));
  };

  const fetchTypes = () => {
    api
      .get('/equipment-types')
      .then((res) => setTypes(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchProcedures();
    fetchTypes();
  }, []);

  const handleEdit = (procedure: ProcedureDTO) => {
    setEditingProcedure(procedure);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingProcedure(null);
    setShowModal(true);
  };

  const requestDelete = (procedure: ProcedureDTO) => {
    setProcedureToDelete(procedure);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!procedureToDelete) return;

    try {
      await api.delete(`/procedures/${procedureToDelete.id}`).then(fetchProcedures);
      toast.success('Процедура видалена');
    } catch (error) {
      console.error('Delete failed', error);
      toast.error('Помилка видалення процедури');
    } finally {
      setShowConfirm(false);
      setProcedureToDelete(null);
    }
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const procedure: Procedure = {
      id: editingProcedure ? editingProcedure.id : Date.now(),
      name: formData.get('name') as string,
      type: periodicityType,
      hours: periodicityType==='hours' ? +engineHours : 0,
      period: periodicityType==='period' ? periodValue : "",
      unit_type_id: +formData.get('equipmentTypeId')!
    };

    if (editingProcedure) {
      api.put(`/procedures/${procedure.id}`, procedure).then(() => {
        setShowModal(false);
        fetchProcedures();
      });
    } else {
      api.post('/procedures', procedure).then(() => {
        setShowModal(false);
        fetchProcedures();
      });
    }
    setShowModal(false);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Регламентні процедури</h4>
        <Button onClick={handleAdd}>Додати процедуру</Button>
      </div>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Тип обладнання</th>
            <th>Назва</th>
            <th>Тип періодичності</th>
            <th>Періодичність</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          {procedures.map((p, idx) => (
            <tr key={p.id}>
              <td>{idx + 1}</td>
              <td>{p.unitType.name}</td>
              <td>{p.name}</td>
              <td>{p.type === 'period' ? 'Період' : 'Мотогодини'}</td>
              <td>{p.type === 'period' ? periodMapping[p.period!] : p.hours}</td>
              <td>
                <Button size="sm" variant="secondary" onClick={() => handleEdit(p)}>
                  Редагувати
                </Button>{' '}
                <Button size="sm" variant="danger" onClick={() => requestDelete(p)}>
                  Видалити
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingProcedure ? 'Редагувати процедуру' : 'Додати процедуру'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Тип обладнання</Form.Label>
              <Form.Select name="equipmentTypeId" required defaultValue={editingProcedure?.unitType?.id || ''}>
                <option value="" disabled>
                  Оберіть тип
                </option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="periodicityType" className="mb-3">
              <Form.Label>Тип періодичності</Form.Label>
              <Form.Select value={periodicityType} onChange={handleTypeChange}>
                <option value="period">Період</option>
                <option value="hours">Мотогодини</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Назва</Form.Label>
              <Form.Control name="name" defaultValue={editingProcedure?.name || ''} required />
            </Form.Group>
            {periodicityType === 'period' && (
              <Form.Group controlId="periodValue" className="mt-3">
                <Form.Label>Період</Form.Label>
                <Form.Select value={periodValue} onChange={(e) => setPeriodValue(e.target.value)}>
                  <option value="">Оберіть період</option>
                  <option value="weekly">Щотижня</option>
                  <option value="monthly">Щомісяця</option>
                  <option value="quarterly">Щокварталу</option>
                  <option value="semiannual">Раз на пів року</option>
                  <option value="annual">Щороку</option>
                </Form.Select>
              </Form.Group>
            )}
            {periodicityType === 'hours' && (
              <Form.Group controlId="engineHours" className="mt-3">
                <Form.Label>Кількість мотогодин</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={engineHours}
                  onChange={(e) => setEngineHours(e.target.value)}
                  placeholder="Введіть кількість мотогодин"
                />
              </Form.Group>
            )}
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
      <ConfirmModal
        show={showConfirm}
        message={`Ви впевнені що хочете видалити "${procedureToDelete?.name} "?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setProcedureToDelete(null);
        }}
      />
    </div>
  );
}
