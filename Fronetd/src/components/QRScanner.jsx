import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const QRScanner = ({ onClose, onScanSuccess }) => {
    const [scanResult, setScanResult] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        // Initialize HTML5 QR Code Scanner
        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true
            },
            /* verbose= */ false
        );

        const handleSuccess = (decodedText) => {
            scanner.clear().then(() => {
                setScanResult(decodedText);
                onScanSuccess(decodedText);
            }).catch((err) => {
                console.error("Failed to clear scanner:", err);
                onScanSuccess(decodedText);
            });
        };

        const handleError = (err) => {
            // Quietly log scanner loop errors to avoid spamming the UI
            console.warn(`QR Scanner error: ${err}`);
        };

        scanner.render(handleSuccess, handleError);

        // Cleanup on unmount
        return () => {
            scanner.clear().catch((err) => {
                console.warn("Error clearing scanner on unmount:", err);
            });
        };
    }, [onScanSuccess]);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative overflow-hidden border border-slate-200">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#004ac6] text-2xl">qr_code_scanner</span>
                        <h3 className="font-bold text-lg text-[#0b1c30]">QR Attendance Check-in</h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="material-symbols-outlined text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1 rounded-full cursor-pointer"
                    >
                        close
                    </button>
                </div>

                {/* Scanner Target Container */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center mb-4">
                    <div id="qr-reader" className="w-full"></div>
                </div>

                {/* Instructions */}
                <div className="text-center text-xs text-[#737686] space-y-1">
                    <p className="font-semibold text-slate-700">Align QR Code inside the scan area</p>
                    <p>Admins: Scan a volunteer's check-in QR code</p>
                    <p>Volunteers: Scan a campaign's check-in QR code</p>
                </div>

                {scanResult && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-semibold text-center">
                        Scanned Result: {scanResult}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScanner;
