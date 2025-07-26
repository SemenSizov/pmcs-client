import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../api/api';
import ConfirmModal from '../components/ConfirmModal';
import type { Location, LocationDTO } from '../types/Location';

export default function AdminEquipmentTypesPage() {
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationDTO | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [locationToDelete, setLocatinoToDelete] = useState<LocationDTO | null>(null);

  const fetchTypes = () => {
    api
      .get('/locations')
      .then((res) => setLocations(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleEdit = (location: LocationDTO) => {
    setEditingLocation(location);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingLocation(null);
    setShowModal(true);
  };

  const requestDelete = (location: LocationDTO) => {
    setLocatinoToDelete(location);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;

    try {
      await api.delete(`/locations/${locationToDelete.id}`).then(() => fetchTypes());
      toast.success('Техніка видалена');
    } catch (error) {
      console.error('Delete failed', error);
      toast.error('Помилка видалення техніки');
    } finally {
      setShowConfirm(false);
      setLocatinoToDelete(null);
    }
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const location: Location = {
      id: editingLocation ? editingLocation.id : 0,
      name: formData.get('name') as string,
    };

    if (editingLocation) {
      api.put(`/locations/${location.id}`, location).then(() => {
        setShowModal(false);
        fetchTypes();
      });
    } else {
      api.post('/locations', location).then(() => {
        setShowModal(false);
        fetchTypes();
      });
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Одиниці техніки</h4>
        <Button onClick={handleAdd}>Додати техніку</Button>
      </div>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Назва</th>
            <th>Обладнання</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((l, idx) => (
            <tr key={l.id}>
              <td>{idx + 1}</td>
              <td>{l.name}</td>
              <td>
                {!l.units?.length ? (
                  ''
                ) : (
                  <ul>
                    {l.units.map((u) => (
                      <li>
                        {u.equipmentType.name}, Serial: {u.serial}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td>
                <Button size="sm" variant="secondary" onClick={() => handleEdit(l)}>
                  Редагувати
                </Button>{' '}
                <Button size="sm" variant="danger" onClick={() => requestDelete(l)}>
                  Видалити
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingLocation ? 'Редагувати техніку' : 'Додати техніку'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Назва</Form.Label>
              <Form.Control name="name" defaultValue={editingLocation?.name || ''} required />
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
        message={`Ви впевнені що хочете видалити "${locationToDelete?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setLocatinoToDelete(null);
        }}
      />
    </div>
  );
}
