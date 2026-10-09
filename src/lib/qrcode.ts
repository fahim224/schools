import QRCode from 'qrcode';

export async function generateQRCode(data: any): Promise<string> {
    try {
        const qrData = JSON.stringify({
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            studentId: data.studentId,
            createdAt: data.createdAt
        });

        // Generate QR code as data URL
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return qrCodeDataURL;
    } catch (error) {
        console.error('QR Code generation error:', error);
        throw error;
    }
}
