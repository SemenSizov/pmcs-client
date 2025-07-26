import { Spinner } from 'react-bootstrap';

interface OverlaySpinnerProps {
  show: boolean;
}

export default function OverlaySpinner({ show }: OverlaySpinnerProps) {
  if (!show) return null;

  return (
    <div
      className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        zIndex: 1000,
      }}
    >
      <Spinner animation="border" role="status" variant="primary" />
    </div>
  );
}
