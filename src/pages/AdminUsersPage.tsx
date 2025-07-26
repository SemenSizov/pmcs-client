import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import api from '../api/api';
import ConfirmModal from '../components/ConfirmModal';
import OverlaySpinner from '../components/OverlaySpinner';
import { toast } from 'react-toastify';
import type { User } from '../types/User';
import { Pencil, Trash } from 'react-bootstrap-icons';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = () => {
    setIsLoading(true);
    api
      .get('/users')
      .then((res) => {
        const sorted = [...res.data].sort((a, b) => a.name.localeCompare(b.name));
        setUsers(sorted);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Не вдалося завантажити користувачів');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const requestDelete = (user: User) => {
    setUserToDelete(user);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success('Користувача видалено');
      fetchUsers();
    } catch (error) {
      console.error('Delete failed', error);
      toast.error('Помилка видалення користувача');
    } finally {
      setShowConfirm(false);
      setUserToDelete(null);
    }
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const user: User = {
      id: editingUser ? editingUser.id : Date.now(),
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as "user" | "admin",
    };

    const action = editingUser
      ? api.put(`/users/${user.id}`, user)
      : api.post('/users', user);

    action.then(() => {
      setShowModal(false);
      fetchUsers();
    });
  };

  return (
    <div className="position-relative">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
        <h4 className="m-0">Користувачі</h4>
        <Button onClick={handleAdd} className="w-100 w-md-auto" style={{ maxWidth: '220px' }}>
          Додати користувача
        </Button>
      </div>

      <div className="table-responsive">
        <Table striped bordered hover className="mb-4">
          <thead>
            <tr>
              <th>#</th>
              <th>Імʼя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.id}>
                <td>{idx + 1}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? 'Редагувати користувача' : 'Додати користувача'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Імʼя</Form.Label>
              <Form.Control
                name="name"
                defaultValue={editingUser?.name || ''}
                required
                autoFocus
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                name="email"
                type="email"
                defaultValue={editingUser?.email || ''}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Роль</Form.Label>
              <Form.Select name="role" defaultValue={editingUser?.role || 'user'} required>
                <option value="user">User</option>
                <option value="admin">Admin</option>
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
        message={`Ви впевнені що хочете видалити "${userToDelete?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setUserToDelete(null);
        }}
      />
    </div>
  );
}
