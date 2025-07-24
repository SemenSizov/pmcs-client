import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import type { Location } from '../types/Location';
import { Pencil, Trash } from 'react-bootstrap-icons';

interface Props {
  location: Location;
  onEditClick: (loc: Location) => void;
  onDeleteClick: (loc: Location) => void;
}

const LocationItem: React.FC<Props> = ({ location, onEditClick, onDeleteClick }) => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
      <span>{location.name}</span>
      <ButtonGroup>
        <Button size="sm" variant="outline-primary" onClick={() => onEditClick(location)}>
          <Pencil/>
        </Button>
        <Button size="sm" variant="outline-danger" onClick={() => onDeleteClick(location)}>
          <Trash/>
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default LocationItem;
