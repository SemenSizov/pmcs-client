import { Modal, Button, Form } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Location } from '../types/Location';
import { toast } from 'react-toastify';

const MAX_NAME_LENGTH = 200;

interface EditModalProps {
  show: boolean;
  location: Location | null;
  existingLocations: Location[]; // <-- нове
  onClose: () => void;
  onSave: (updated: Location) => void;
}

const EditModal: React.FC<EditModalProps> = ({ show, location, onClose, onSave, existingLocations }) => {
  const [formData, setFormData] = useState<Location>({ id: 0, name: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location) {
      setFormData(location);
    }
  }, [location]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClose = ()=>{
    setError(null);
    onClose()
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const trimmed = formData.name.trim();
    const isDuplicate = existingLocations.some(
      (loc) => loc.name.trim().toLowerCase() === trimmed.toLowerCase() && loc.id !== formData.id
    );

    if (!trimmed) {
      setError('Name is required.');
      return;
    }

    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(`Name must be at most ${MAX_NAME_LENGTH} characters.`);
      return;
    }

    if (isDuplicate) {
      toast.error('A location with this name already exists.');
      return;
    }
    setError(null)
    onSave({ ...formData, name: trimmed });
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{formData.id === 0 ? 'Add Location' : 'Edit Location'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="locationName">
            <Form.Label>Name</Form.Label>
            <Form.Control
              name="name"
              value={formData.name}
              onChange={handleChange}
              isInvalid={!!error}
              maxLength={MAX_NAME_LENGTH}
              placeholder="Enter location name"
            />
            <Form.Control.Feedback type="invalid">
              {error}
            </Form.Control.Feedback>
            <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
              {formData.name.trim().length} / {MAX_NAME_LENGTH} characters
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditModal;
