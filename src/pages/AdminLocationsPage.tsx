import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import ConfirmModal from '../components/ConfirmModal';
import OverlaySpinner from '../components/OverlaySpinner';
import type { Location, LocationDTO } from '../types/Location';
import { Pencil, Trash } from 'react-bootstrap-icons';
import { addLocation, deleteLocation, getLocations, updateLocation } from '../api/locations.api';

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationDTO | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<LocationDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLocations = () => {
    setIsLoading(true);
    getLocations()
      .then((res) => {
        const sorted = [...res.data].sort((a, b) => a.name.localeCompare(b.name));
        setLocations(sorted);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Не вдалося завантажити список техніки');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLocations();
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
    setLocationToDelete(location);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;

    try {
      await deleteLocation(locationToDelete.id);
      toast.success('Техніка видалена');
      fetchLocations();
    } catch (error) {
      console.error('Delete failed', error);
      toast.error('Помилка видалення техніки');
    } finally {
      setShowConfirm(false);
      setLocationToDelete(null);
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

    const action = editingLocation
      ? updateLocation(location)
      : addLocation(location);

    action.then(() => {
      setShowModal(false);
      fetchLocations();
    });
  };

  return (
    <div className="position-relative">
      <ToastContainer />
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
        <h4 className="m-0">Одиниці техніки</h4>
        <Button onClick={handleAdd} className="w-100 w-md-auto" style={{ maxWidth: '220px' }}>
          Додати техніку
        </Button>
      </div>

      <div className="table-responsive">
        <Table striped bordered hover className="mb-4">
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
                  {l.units?.length ? (
                    <ul className="mb-0">
                      {l.units.map((u) => (
                        <li key={u.id}>
                          {u.equipmentType.name}, #{u.serial}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted">немає</span>
                  )}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(l)}>
                      <Pencil />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => requestDelete(l)}>
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
          <Modal.Title>{editingLocation ? 'Редагувати техніку' : 'Додати техніку'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Назва</Form.Label>
              <Form.Control
                name="name"
                defaultValue={editingLocation?.name || ''}
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
            <Button type="submit" variant="primary" className="w-100" style={{ maxWidth: '220px' }}>
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
          setLocationToDelete(null);
        }}
      />
    </div>
  );
}
