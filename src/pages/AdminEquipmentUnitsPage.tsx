import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../api/api';
import ConfirmModal from '../components/ConfirmModal';

interface UnitType {
  id: number;
  name: string;
}

interface Location {
  id: number;
  name: string;
}

interface UnitDTO {
  id: string;
  serial: string;
  unitType: UnitType;
  location: Location;
}

interface Unit {
  id: string;
  serial: string;
  unitTypeId: string;
  locationId: string
}

export default function AdminEquipmentUnitsPage() {
  const [types, setTypes] = useState<UnitType[]>([]);
  const [units, setUnits] = useState<UnitDTO[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitDTO | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<UnitDTO | null>(null);

  const fetchUnits = () => {
    api
      .get('/equipment-units')
      .then((res) => setUnits(res.data))
      .catch((err) => console.error(err));
  };

  const fetchTypes = () => {
    api
      .get('/equipment-types')
      .then((res) => setTypes(res.data))
      .catch((err) => console.error(err));
  };

  const fetchLocations = () => {
    api
      .get('/locations')
      .then((res) => setLocations(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchUnits();
    fetchTypes();
    fetchLocations();
  }, []);

  const handleEdit = (unit: UnitDTO) => {
    setEditingUnit(unit);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingUnit(null);
    setShowModal(true);
  };

  const requestDelete = (unit: UnitDTO) => {
    setUnitToDelete(unit);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!unitToDelete) return;

    try {
      await api.delete(`/equipment-units/${unitToDelete.id}`).then(() => fetchUnits());
      toast.success('Одиниця обладнання видалена');
    } catch (error) {
      console.error('Delete failed', error);
      toast.error('Помилка видалення одиниці обладнання');
    } finally {
      setShowConfirm(false);
      setUnitToDelete(null);
    }
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const unit: Unit = {
      id: editingUnit ? editingUnit.id : "0",
      serial: formData.get('serial') as string,
      unitTypeId:formData.get('equipmentTypeId') as string,
      locationId:formData.get('locationId') as string
    };

    if (editingUnit) {
      api.put(`/equipment-units/${unit.id}`, unit).then(() => {
        setShowModal(false);
        fetchUnits();
      });
    } else {
      api.post('/equipment-units', unit).then(() => {
        setShowModal(false);
        fetchUnits();
      });
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Одиниці обладнання</h4>
        <Button onClick={handleAdd}>Додати обладнання</Button>
      </div>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Серійни номер</th>
            <th>Тип обладнання</th>
            <th>Встановлено на техніку</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          {units.map((u, idx) => (
            <tr key={u.id}>
              <td>{idx + 1}</td>
              <td>{u.serial}</td>
              <td>{u.unitType.name}</td>
              <td>{u.location.name}</td>
              <td>
                <Button size="sm" variant="secondary" onClick={() => handleEdit(u)}>
                  Редагувати
                </Button>{' '}
                <Button size="sm" variant="danger" onClick={() => requestDelete(u)}>
                  Видалити
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingUnit ? 'Редагувати обладнання' : 'Додати обладнання'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Тип обладнання</Form.Label>
              <Form.Select name="equipmentTypeId" required defaultValue={editingUnit?.unitType?.id || ''}>
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
              <Form.Label>Серійний номер</Form.Label>
              <Form.Control name="serial" defaultValue={editingUnit?.serial || ''} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Встановлено на техніку</Form.Label>
              <Form.Select name="locationId" required defaultValue={editingUnit?.location?.id || ''}>
                <option value="" disabled>
                  Оберіть техніку
                </option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </Form.Select>
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
        message={`Ви впевнені що хочете видалити "${unitToDelete?.unitType.name}" з серійним номером "${unitToDelete?.serial}"?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setUnitToDelete(null);
        }}
      />
    </div>
  );
}
