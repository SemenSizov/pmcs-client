import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import api from '../api/api';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-toastify';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = () => {
    api
      .get('/users')
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));
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
      await api.delete(`/users/${userToDelete.id}`).then(fetchUsers);
      toast.success('Користувач видалений');
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
    const user = {
      id: editingUser ? editingUser.id : Date.now(),
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
    };

    if (editingUser) {
      api.put(`/users/${user.id}`, user).then(() => {
        setShowModal(false);
        fetchUsers();
      });
    } else {
      api.post('/users', user).then(() => {
        setShowModal(false);
        fetchUsers();
      });
    }
    setShowModal(false);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Користувачі</h4>
        <Button onClick={handleAdd}>Додати користувача</Button>
      </div>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Ім'я</th>
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
          <Modal.Title>{editingUser ? 'Редагувати користувача' : 'Додати користувача'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Ім'я</Form.Label>
              <Form.Control name="name" defaultValue={editingUser?.name || ''} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control name="email" type="email" defaultValue={editingUser?.email || ''} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Роль</Form.Label>
              <Form.Select name="role" defaultValue={editingUser?.role || 'user'} required>
                <option value="user">User</option>
                <option value="admin">Admin</option>
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
