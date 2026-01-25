import { useRef, useImperativeHandle, forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
    onChange?: (isEmpty: boolean) => void;
}

export interface SignaturePadRef {
    toDataURL: () => string;
    clear: () => void;
    isEmpty: () => boolean;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ onChange }, ref) => {
    const sigCanvas = useRef<SignatureCanvas>(null);

    useImperativeHandle(ref, () => ({
        toDataURL: () => {
            return sigCanvas.current?.getCanvas().toDataURL('image/png') || '';
        },
        clear: () => {
            sigCanvas.current?.clear();
            onChange?.(true);
        },
        isEmpty: () => {
            return sigCanvas.current?.isEmpty() || true;
        }
    }));

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{
                    className: 'w-full h-40',
                    width: 500, // Ideally responsive, but canvas needs explicit size or resize handling
                    height: 160
                }}
                onEnd={() => onChange?.(sigCanvas.current?.isEmpty() || false)}
            />
        </div>
    );
});

export default SignaturePad;
