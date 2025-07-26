import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../api/api';
import ConfirmModal from '../components/ConfirmModal';
import OverlaySpinner from '../components/OverlaySpinner';
import type { EquipmentType } from '../types/EquipmentType';
import { Pencil, Trash } from 'react-bootstrap-icons';

export default function AdminEquipmentTypesPage() {
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<EquipmentType | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<EquipmentType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTypes = () => {
    setIsLoading(true);
    api
      .get('/equipment-types')
      .then((res) => {
        const sorted = [...res.data].sort((a: EquipmentType, b: EquipmentType) =>
          a.name.localeCompare(b.name)
        );
        setTypes(sorted);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Не вдалося завантажити типи обладнання');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleEdit = (type: EquipmentType) => {
    setEditingType(type);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingType(null);
    setShowModal(true);
  };

  const requestDelete = (type: EquipmentType) => {
    setTypeToDelete(type);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!typeToDelete) return;

    try {
      await api.delete(`/equipment-types/${typeToDelete.id}`);
      toast.success('Тип обладнання видалено');
      fetchTypes();
    } catch (error) {
      console.error('Delete failed', error);
      toast.error('Помилка видалення типу обладнання');
    } finally {
      setShowConfirm(false);
      setTypeToDelete(null);
    }
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const type: EquipmentType = {
      id: editingType ? editingType.id : 0,
      name: formData.get('name') as string,
    };

    const action = editingType
      ? api.put(`/equipment-types/${type.id}`, type)
      : api.post('/equipment-types', type);

    action.then(() => {
      setShowModal(false);
      fetchTypes();
    });
  };

  return (
    <div className="position-relative">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
        <h4 className="m-0">Типи техніки</h4>
        <Button onClick={handleAdd} className="w-100 w-md-auto" style={{ maxWidth: '220px' }}>
          Додати тип
        </Button>
      </div>

      <div className="table-responsive">
        <Table striped bordered hover className="mb-4">
          <thead>
            <tr>
              <th>#</th>
              <th>Назва</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t, idx) => (
              <tr key={t.id}>
                <td>{idx + 1}</td>
                <td>{t.name}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(t)}>
                      <Pencil />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => requestDelete(t)}>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>{editingType ? 'Редагувати тип' : 'Додати тип'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Назва</Form.Label>
              <Form.Control
                name="name"
                defaultValue={editingType?.name || ''}
                required
                autoFocus
              />
            </Form.Group>
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
            <Button
              type="submit"
              variant="primary"
              className="w-100"
              style={{ maxWidth: '220px' }}
            >
              Зберегти
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={showConfirm}
        message={`Ви впевнені, що хочете видалити "${typeToDelete?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setTypeToDelete(null);
        }}
      />
    </div>
  );
}
