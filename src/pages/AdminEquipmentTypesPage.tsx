import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../api/api';
import ConfirmModal from '../components/ConfirmModal';
import type { EquipmentType } from '../types/EquipmentType';

export default function AdminEquipmentTypesPage() {
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<EquipmentType | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<EquipmentType | null>(null);

  const fetchTypes = () => {
    api
      .get('/equipment-types')
      .then((res) => setTypes(res.data))
      .catch((err) => console.error(err));
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

  const requestDelete = (user: EquipmentType) => {
    setTypeToDelete(user);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!typeToDelete) return;

    try {
      await api.delete(`/equipment-types/${typeToDelete.id}`).then(() => fetchTypes());
      toast.success('Тип обладнання видалений');
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

    if (editingType) {
      api.put(`/equipment-types/${type.id}`, type).then(() => {
        setShowModal(false);
        fetchTypes();
      });
    } else {
      api.post('/equipment-types', type).then(() => {
        setShowModal(false);
        fetchTypes();
      });
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Типи техніки</h4>
        <Button onClick={handleAdd}>Додати тип</Button>
      </div>
      <Table striped bordered hover>
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
                <Button size="sm" variant="secondary" onClick={() => handleEdit(t)}>
                  Редагувати
                </Button>{' '}
                <Button size="sm" variant="danger" onClick={() => requestDelete(t)}>
                  Видалити
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingType ? 'Редагувати тип' : 'Додати тип'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Назва</Form.Label>
              <Form.Control name="name" defaultValue={editingType?.name || ''} required />
            </Form.Group>
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
        message={`Ви впевнені що хочете видалити "${typeToDelete?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setTypeToDelete(null);
        }}
      />
    </div>
  );
}
