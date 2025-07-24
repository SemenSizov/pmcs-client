import { useEffect, useState } from 'react';
import { Container, Card, Button, Spinner, Alert } from 'react-bootstrap';
import api from '../api/api';
import LocationItem from './LocationItem';
import EditModal from './EditModal';
import type { Location } from '../types/Location';
import ConfirmModal from './ConfirmModal';
import { toast } from 'react-toastify';

const LocationList: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await api.get<Location[]>('/locations');
      setLocations(res.data);
    } catch (error) {
      console.error('Failed to fetch locations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (location: Location) => {
    setSelectedLocation(location);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedLocation({ id: 0, name: '' });
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleEditSave = async (data: Location) => {
    try {
      if (isCreating) {
        await api.post('/locations', data);
        toast.success('Location added');
      } else {
        await api.put(`/locations/${data.id}`, data);
        toast.success('Location updated');
      }
      await fetchLocations();
    } catch (error) {
      console.error('Save failed', error);
      toast.error('Failed to save location');
    }
  };

  const requestDelete = (location: Location) => {
    setLocationToDelete(location);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;

    try {
      await api.delete(`/locations/${locationToDelete.id}`);
      setLocations((prev) => prev.filter((loc) => loc.id !== locationToDelete.id));
      toast.success('Location deleted');
    } catch (error) {
      console.error('Delete failed', error);
      toast.error('Failed to delete location');
    } finally {
      setShowConfirm(false);
      setLocationToDelete(null);
    }
  };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Locations</h5>
          <Button variant="success" onClick={handleAddClick}>
            + Add
          </Button>
        </Card.Header>

        <Card.Body>
          {loading ? (
            <div className="text-center mt-4">
              <Spinner animation="border" role="status" />
            </div>
          ) : locations.length === 0 ? (
            <Alert variant="info">No locations available.</Alert>
          ) : (
            locations.map((location) => (
              <LocationItem
                key={location.id}
                location={location}
                onEditClick={handleEditClick}
                onDeleteClick={requestDelete}
              />
            ))
          )}
        </Card.Body>
      </Card>

      <EditModal
        show={isModalOpen}
        location={selectedLocation}
        existingLocations={locations} // <-- передаємо для перевірки
        onClose={() => setIsModalOpen(false)}
        onSave={handleEditSave}
      />
      <ConfirmModal
        show={showConfirm}
        message={`Are you sure you want to delete "${locationToDelete?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setLocationToDelete(null);
        }}
      />
    </Container>
  );
};

export default LocationList;
