import { Form, Image, Button } from 'react-bootstrap';
import { useState } from 'react';

interface Props {
    onImageSelect: (file: File | null) => void;
    label: string;
}

export const ImageUploader = ({ onImageSelect, label }: Props) => {
    const [preview, setPreview] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setPreview(URL.createObjectURL(file));
            onImageSelect(file);
        } else {
            setPreview(null);
            onImageSelect(null);
        }
    };

    return (
        <Form.Group className="mb-3">
            <Form.Label>{label}</Form.Label>
            <Form.Control
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleChange}
            />
            {preview && (
                <div className="mt-2 text-center">
                    <Image src={preview} thumbnail style={{ maxHeight: '200px' }} />
                    <div className="mt-1">
                        <Button variant="link" size="sm" className="text-danger" onClick={() => { setPreview(null); onImageSelect(null); }}>
                            Видалити фото
                        </Button>
                    </div>
                </div>
            )}
        </Form.Group>
    );
};