import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import ConfirmModal from '../components/ConfirmModal';
import OverlaySpinner from '../components/OverlaySpinner';
import { toast, ToastContainer } from 'react-toastify';
import type { EquipmentType } from '../types/EquipmentType';
import type { Procedure, ProcedureDTO } from '../types/Procedure';
import { Pencil, Trash } from 'react-bootstrap-icons';
import { addProcedure, deleteProcedure, getProcedures, updateProcedure } from '../api/procedures.api';
import { getEquipmentTypes } from '../api/equipmentTypes.api';

const periodMapping = {
  weekly: 'Щотижня',
  monthly: 'Щомісяця',
  quarterly: 'Щокварталу',
  semiannual: 'Раз на півроку',
  annual: 'Щороку',
};

export default function AdminProceduresPage() {
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [procedures, setProcedures] = useState<ProcedureDTO[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureDTO | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<ProcedureDTO | null>(null);
  const [periodicityType, setPeriodicityType] = useState<'period' | 'hours'>('period');
  const [periodValue, setPeriodValue] = useState('');
  const [engineHours, setEngineHours] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'period' | 'hours';
    setPeriodicityType(type);
    setPeriodValue('');
    setEngineHours('');
  };

  const fetchProcedures = () => {
    setIsLoading(true);
    getProcedures()
      .then((res) => {
        setProcedures(res.data);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Не вдалося завантажити процедури');
      })
      .finally(() => setIsLoading(false));
  };

  const fetchTypes = () => {
    getEquipmentTypes()
      .then((res) => setTypes(res.data))
      .catch((err) => {
        console.error(err);
        toast.error('Не вдалося завантажити типи обладнання');
      });
  };

  useEffect(() => {
    fetchProcedures();
    fetchTypes();
  }, []);

  const handleEdit = (procedure: ProcedureDTO) => {
    setEditingProcedure(procedure);
    setPeriodicityType(procedure.type);
    setPeriodValue(procedure.period || '');
    setEngineHours(procedure.hours?.toString() || '');
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingProcedure(null);
    setPeriodicityType('period');
    setPeriodValue('');
    setEngineHours('');
    setShowModal(true);
  };

  const requestDelete = (procedure: ProcedureDTO) => {
    setProcedureToDelete(procedure);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!procedureToDelete) return;
    try {
      await deleteProcedure(procedureToDelete.id);
      toast.success('Процедуру видалено');
      fetchProcedures();
    } catch (error) {
      toast.error('Помилка видалення процедури');
    } finally {
      setShowConfirm(false);
      setProcedureToDelete(null);
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const procedure: Procedure = {
      id: editingProcedure ? editingProcedure.id : Date.now(),
      name: formData.get('name') as string,
      type: periodicityType,
      hours: periodicityType === 'hours' ? +engineHours : 0,
      period: periodicityType === 'period' ? periodValue : '',
      equipment_type_id: +formData.get('equipmentTypeId')!,
    };

    try {
      if (editingProcedure) {
        await updateProcedure(procedure)
      } else {
        await addProcedure(procedure)
      }
      toast.success('Процедура збережена');
      fetchProcedures();
      setShowModal(false);
    } catch (e) {
      toast.error('Помилка збереження процедури');
    }
  };

  return (
    <div className="position-relative">
      <ToastContainer />
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
        <h4 className="m-0">Регламентні процедури</h4>
        <Button onClick={handleAdd} className="w-100 w-md-auto" style={{ maxWidth: '220px' }}>
          Додати процедуру
        </Button>
      </div>

      <div className="table-responsive">
        <Table striped bordered hover className="mb-4">
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
                <td>{p.equipmentType.name}</td>
                <td>{p.name}</td>
                <td>{p.type === 'period' ? 'Період' : 'Мотогодини'}</td>
                <td>{p.type === 'period' ? periodMapping[p.period!] : p.hours}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(p)}>
                      <Pencil />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => requestDelete(p)}>
                      <Trash />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <OverlaySpinner show={isLoading} />

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingProcedure ? 'Редагувати процедуру' : 'Додати процедуру'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Тип обладнання</Form.Label>
              <Form.Select name="equipmentTypeId" required defaultValue={editingProcedure?.equipmentType?.id || ''}>
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

            <Form.Group className="mb-3">
              <Form.Label>Тип періодичності</Form.Label>
              <Form.Select value={periodicityType} onChange={handleTypeChange}>
                <option value="period">Період</option>
                <option value="hours">Мотогодини</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Назва</Form.Label>
              <Form.Control name="name" defaultValue={editingProcedure?.name || ''} required autoFocus />
            </Form.Group>

            {periodicityType === 'period' && (
              <Form.Group className="mb-3">
                <Form.Label>Період</Form.Label>
                <Form.Select value={periodValue} onChange={(e) => setPeriodValue(e.target.value)} required>
                  <option value="">Оберіть період</option>
                  {Object.entries(periodMapping).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {periodicityType === 'hours' && (
              <Form.Group className="mb-3">
                <Form.Label>Кількість мотогодин</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={engineHours}
                  onChange={(e) => setEngineHours(e.target.value)}
                  required
                />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer className="d-flex flex-column flex-sm-row justify-content-sm-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="w-100"
              style={{ maxWidth: '220px' }}
            >
              Скасувати
            </Button>
            <Button type="submit" variant="primary" className="w-100" style={{ maxWidth: '220px' }}>
              Зберегти
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={showConfirm}
        message={`Ви впевнені що хочете видалити "${procedureToDelete?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setProcedureToDelete(null);
        }}
      />
    </div>
  );
}
