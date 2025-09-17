function statusMeta(status?: 'ok' | 'warning' | 'error') {
    switch (status) {
        case 'ok':
            return { label: 'OK', variant: 'success' as const, bgClass: 'bg-success' };
        case 'warning':
            return { label: 'Увага', variant: 'warning' as const, bgClass: 'bg-warning' };
        case 'error':
            return { label: 'Увага', variant: 'danger' as const, bgClass: 'bg-danger' };
        default:
            return { label: 'Н/д', variant: 'secondary' as const, bgClass: 'bg-secondary' };
    }
}

const STATUS_DOT_STYLE: React.CSSProperties = {
    display: 'inline-block',
    width: '.6rem',
    height: '.6rem',
    borderRadius: 9999,
    margin: '.6rem'
};

interface ColoredDotProps {
    status: 'ok' | 'warning' | 'error'
}

const ColoredDot = ({ status }: ColoredDotProps) => {
    const sm = statusMeta(status);

    return (
        <span
            className={sm.bgClass}
            style={STATUS_DOT_STYLE}
            title={sm.label}
            aria-label={sm.label}
        />
    )
}

export default ColoredDot