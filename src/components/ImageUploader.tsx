import { Form, Image, Button } from 'react-bootstrap';
import { useState } from 'react';
import { compressImage } from '../utils/imageCompression';

interface Props {
    onImageSelect: (file: File | null) => void;
    label: string;
}

export const ImageUploader = ({ onImageSelect, label }: Props) => {
    const [preview, setPreview] = useState<string | null>(null);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            try {
                // Показуємо оригінал для прев'ю (щоб було миттєво)
                setPreview(URL.createObjectURL(file));

                // Стискаємо перед тим, як передати у форму
                const compressed = await compressImage(file, 1200, 0.6);
                console.log(`Original: ${file.size / 1024}KB, Compressed: ${compressed.size / 1024}KB`);

                onImageSelect(compressed);
            } catch (err) {
                console.error("Compression error:", err);
                onImageSelect(file); // Якщо щось пішло не так — шлемо оригінал
            }
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
                // capture="environment"
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