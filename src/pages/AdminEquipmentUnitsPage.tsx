import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import ConfirmModal from '../components/ConfirmModal';
import type { EquipmentType } from '../types/EquipmentType';
import type { EquipmentUnit, EquipmentUnitDTO } from '../types/EquipmentUnit';
import type { Location } from '../types/Location';
import { Pencil, Trash } from 'react-bootstrap-icons';
import OverlaySpinner from '../components/OverlaySpinner';
import {
  addEquipmentUnit,
  deleteEquipmentUnit,
  getEquipmentUnits,
  updateEquipmentUnit,
} from '../api/equipmentUnits.api';
import { getEquipmentTypes } from '../api/equipmentTypes.api';
import { getLocations } from '../api/locations.api';

export default function AdminEquipmentUnitsPage() {
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [units, setUnits] = useState<EquipmentUnitDTO[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<EquipmentUnitDTO | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<EquipmentUnitDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnits = () => {
    setIsLoading(true);
    getEquipmentUnits()
      .then((res) => {
        const units = res.data as EquipmentUnitDTO[];
        units.sort((a: EquipmentUnitDTO, b: EquipmentUnitDTO) => a.location.name.localeCompare(b.location.name));
        setUnits(units);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Не вдалося завантажити список обладнання');
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

  const fetchLocations = () => {
    getLocations()
      .then((res) => setLocations(res.data))
      .catch((err) => {
        console.error(err);
        toast.error('Не вдалося завантажити список техніки');
      });
  };

  useEffect(() => {
    fetchUnits();
    fetchTypes();
    fetchLocations();
  }, []);

  const handleEdit = (unit: EquipmentUnitDTO) => {
    setEditingUnit(unit);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingUnit(null);
    setShowModal(true);
  };

  const requestDelete = (unit: EquipmentUnitDTO) => {
    setUnitToDelete(unit);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!unitToDelete) return;

    try {
      await deleteEquipmentUnit(+unitToDelete.id);
      toast.success('Одиниця обладнання видалена');
      fetchUnits();
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
    const unit: EquipmentUnit = {
      id: editingUnit ? editingUnit.id : '0',
      serial: formData.get('serial') as string,
      equipmentTypeId: formData.get('equipmentTypeId') as string,
      locationId: formData.get('locationId') as string,
    };

    const action = editingUnit ? updateEquipmentUnit(unit) : addEquipmentUnit(unit);

    action
      .then(() => {
        toast.success('Збережено');
        setShowModal(false);
        fetchUnits();
      })
      .catch(() => toast.error('Помилка збереження'));
  };
  return (
    <div className="position-relative">
      <ToastContainer />
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
        <h4 className="m-0">Одиниці обладнання</h4>
        <Button onClick={handleAdd} className="w-100 w-md-auto" style={{ maxWidth: '220px' }}>
          Додати обладнання
        </Button>
      </div>

      <div className="table-responsive">
        <Table striped bordered hover className="mb-4">
          <thead>
            <tr>
              <th>#</th>
              <th>Тип обладнання</th>
              <th>Серійний номер</th>
              <th>Встановлено на техніку</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u, idx) => (
              <tr key={u.id}>
                <td>{idx + 1}</td>
                <td>{u.equipmentType.name}</td>
                <td>{u.serial}</td>
                <td>{u.location.name}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(u)}>
                      <Pencil />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => requestDelete(u)}>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingUnit ? 'Редагувати обладнання' : 'Додати обладнання'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Тип обладнання</Form.Label>
              <Form.Select name="equipmentTypeId" required defaultValue={editingUnit?.equipmentType?.id || ''}>
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
              <Form.Control name="serial" defaultValue={editingUnit?.serial || ''} required autoFocus />
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
        message={`Ви впевнені що хочете видалити "${unitToDelete?.equipmentType.name}" з серійним номером "${unitToDelete?.serial}"?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setUnitToDelete(null);
        }}
      />
    </div>
  );
}
