import { Modal, Button } from 'react-bootstrap';
import type { FC } from 'react';

interface ConfirmModalProps {
  show: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: FC<ConfirmModalProps> = ({
  show,
  title = 'Підтвердження дії',
  message,
  onConfirm,
  onCancel,
}) => (
  <Modal show={show} onHide={onCancel} centered size="sm">
    <Modal.Header closeButton>
      <Modal.Title className="w-100 text-center">{title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p className="text-wrap text-center">{message}</p>
    </Modal.Body>
    <Modal.Footer className="d-flex flex-column flex-sm-row gap-2">
      <Button variant="secondary" onClick={onCancel} className="w-100">
        Відмінити
      </Button>
      <Button variant="danger" onClick={onConfirm} className="w-100">
        Підтвердити
      </Button>
    </Modal.Footer>
  </Modal>
);

export default ConfirmModal;
