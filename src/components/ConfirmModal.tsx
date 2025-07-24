import { Modal, Button } from 'react-bootstrap';
import type { FC } from 'react';

interface ConfirmModalProps {
  show: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: FC<ConfirmModalProps> = ({ show, title = 'Підтвердження дії', message, onConfirm, onCancel }) => (
  <Modal show={show} onHide={onCancel} centered>
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>{message}</p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onCancel}>Відмінити</Button>
      <Button variant="danger" onClick={onConfirm}>Підтвердити</Button>
    </Modal.Footer>
  </Modal>
);

export default ConfirmModal;
