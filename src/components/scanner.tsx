
'use client'
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

interface ScannedItem {
    code: string;
    fecha: string;
    hora: string;
    encargado: string;
    area: string;
}

const Scanner = () => {
    const [message, setMessage] = useState({ text: 'Esperando para escanear...', type: 'info' });
    const [encargado, setEncargado] = useState('');
    const [scannedData, setScannedData] = useState<ScannedItem[]>([]);
    const [totalScans, setTotalScans] = useState(0);
    const [uniqueScans, setUniqueScans] = useState(0);
    const [otherScans, setOtherScans] = useState(0);
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedScannerMode, setSelectedScannerMode] = useState('camara');
    const [scannerActive, setScannerActive] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
    const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationData, setConfirmationData] = useState({ title: '', message: '', code: '', resolve: (confirmed: boolean) => {} });


    const html5QrCodeRef = useRef<any>(null);
    const physicalScannerInputRef = useRef<HTMLInputElement | null>(null);
    const scannedCodesRef = useRef(new Set<string>());
    const videoTrackRef = useRef<MediaStreamTrack | null>(null);
    const readerRef = useRef<HTMLDivElement | null>(null);


    useEffect(() => {
        if (readerRef.current) {
            const qrCodeScanner = new Html5Qrcode(readerRef.current.id);
            html5QrCodeRef.current = qrCodeScanner;

            Html5Qrcode.getCameras()
                .then((devices: any) => {
                    if (devices && devices.length) {
                        setCameras(devices);
                        const rearCameraIndex = devices.findIndex(camera => camera.label.toLowerCase().includes('back') || camera.label.toLowerCase().includes('trasera'));
                        if (rearCameraIndex !== -1) setCurrentCameraIndex(rearCameraIndex);
                    }
                })
                .catch((err:unknown) => console.error("No se pudieron obtener las cámaras:", err));

            return () => {
                if (qrCodeScanner && qrCodeScanner.getState() === Html5QrcodeScannerState.SCANNING) {
                    qrCodeScanner.stop().catch((err:unknown) => {
                        console.error("Error al detener el escáner al desmontar.", err);
                    });
                }
            };
        }
    }, []);

    const showMessageUI = (text: string, type: string) => {
        setMessage({ text, type });
    };

    const clearSessionData = () => {
        scannedCodesRef.current.clear();
        setScannedData([]);
        setTotalScans(0);
        setUniqueScans(0);
        setOtherScans(0);
    };
    
    const confirmAction = (title: string, message: string, code: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmationData({ title, message, code, resolve });
            setShowConfirmation(true);
        });
    };
    
    const handleConfirmation = (confirmed: boolean) => {
        setShowConfirmation(false);
        confirmationData.resolve(confirmed);
    };

    const addCodeAndUpdateCounters = async (codeToAdd: string) => {
        const finalCode = codeToAdd.trim();
        if (!finalCode) return false;

        if (scannedCodesRef.current.has(finalCode)) {
            showMessageUI(`DUPLICADO: ${finalCode}`, 'duplicate');
            return false;
        }

        let confirmed = true;
        if (!finalCode.startsWith('4')) {
            confirmed = await confirmAction('Advertencia', 'Este no es un código MEL, ¿desea agregar?', finalCode);
        }

        if (confirmed) {
            scannedCodesRef.current.add(finalCode);
            if (finalCode.startsWith('4')) {
                setUniqueScans(prev => prev + 1);
            } else {
                setOtherScans(prev => prev + 1);
            }
            setTotalScans(prev => prev + 1);
    
            const now = new Date();
            const fechaEscaneo = now.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const horaEscaneo = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            
            setScannedData(prev => [...prev, { code: finalCode, fecha: fechaEscaneo, hora: horaEscaneo, encargado, area: selectedArea }]);
            showMessageUI(`ÉXITO: ${finalCode}`, 'success');
            return true;
        }
        showMessageUI('Escaneo cancelado.', 'info');
        return false;
    };
    
    const onScanSuccess = (decodedText: string) => {
        addCodeAndUpdateCounters(decodedText);
    };

    const startCameraScanner = () => {
        if (!html5QrCodeRef.current || cameras.length === 0) return;

        setScannerActive(true);
        const cameraId = cameras[currentCameraIndex].id;
        html5QrCodeRef.current.start(
            cameraId,
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                videoConstraints: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: "environment"
                }
            },
            onScanSuccess,
            () => {}
        ).then(() => {
            const videoElement = document.querySelector('#reader video') as HTMLVideoElement;
            if (videoElement) {
                videoTrackRef.current = videoElement.srcObject instanceof MediaStream ? videoElement.srcObject.getVideoTracks()[0] : null;
            }
        }).catch(() => {
            setScannerActive(false);
            showMessageUI('Error al iniciar la cámara. Revisa los permisos.', 'duplicate');
        });
    };

    const stopCameraScanner = () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
            html5QrCodeRef.current.stop().then(() => {
                setScannerActive(false);
                videoTrackRef.current = null;
            }).catch((err:unknown) => {
                console.error("Error al detener el escáner.", err);
                setScannerActive(false);
            });
        }
    };
    
    const handleStartScan = () => {
        if (!encargado) {
            showMessageUI('Por favor, ingresa el nombre del encargado.', 'duplicate');
            return;
        }
        if (!selectedArea) {
            showMessageUI('Por favor, selecciona un área.', 'duplicate');
            return;
        }
        if (selectedScannerMode === 'camara') {
            startCameraScanner();
        } else {
            setScannerActive(true);
            physicalScannerInputRef.current?.focus();
        }
    };

    const handleStopScan = () => {
        if (selectedScannerMode === 'camara') {
            stopCameraScanner();
        }
        setScannerActive(false);
    };

    const handleExportCsv = () => {
        if (scannedData.length === 0) {
            showMessageUI('No hay datos para exportar.', 'duplicate');
            return;
        }
        const BOM = "\uFEFF";
        const headers = "CODIGO MEL,FECHA DE ESCANEO,HORA DE ESCANEO,ENCARGADO,AREA QUE REGISTRA\n";
        const csvRows = scannedData.map(row => `"${row.code}","${row.fecha}","${row.hora}","${row.encargado}","${row.area}"`).join('\n');
        const blob = new Blob([BOM + headers + csvRows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "export.csv";
        link.click();
    };
    
    const handleIngresarDatos = () => {
        console.log("Ingresando datos...", scannedData);
        showMessageUI('Datos ingresados correctamente (simulación).', 'success');
        clearSessionData();
    };

    const handleManualAdd = () => {
        if(manualCode) {
            addCodeAndUpdateCounters(manualCode);
            setManualCode("");
        }
    }
    
    const handlePhysicalScannerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            addCodeAndUpdateCounters(e.currentTarget.value);
            e.currentTarget.value = "";
        }
    }
    
    const toggleFlash = () => {
        if (!videoTrackRef.current) return;
    
        const capabilities = videoTrackRef.current.getCapabilities() as any;
    
        if (capabilities.torch) {
            const newFlashState = !isFlashOn;
    
            videoTrackRef.current.applyConstraints({
                advanced: [{ torch: newFlashState }]
            })
            .then(() => setIsFlashOn(newFlashState))
            .catch(e => console.error("Error al activar flash", e));
        }
    };
    

    const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = parseFloat(e.target.value);
        if (videoTrackRef.current && videoTrackRef.current.getCapabilities().zoom) {
            videoTrackRef.current.applyConstraints({ advanced: [{ zoom: newZoom }] })
                .then(() => setZoom(newZoom))
                .catch(e => console.error("Error al hacer zoom", e));
        }
    };
    
    const changeCamera = () => {
        if (scannerActive && cameras.length > 1) {
            stopCameraScanner();
            setCurrentCameraIndex((currentCameraIndex + 1) % cameras.length);
        }
    };
    
    useEffect(() => {
        if (scannerActive && selectedScannerMode === 'camara') {
            startCameraScanner();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCameraIndex]);

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-6 md:p-8 space-y-6">
            {showConfirmation && (
                <div id="qr-confirmation-overlay" className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center space-y-4">
                        <h3 className="text-lg font-bold text-gray-800">{confirmationData.title}</h3>
                        <p className="text-sm text-gray-600">{confirmationData.message}</p>
                        <div className="bg-gray-100 p-3 rounded-md font-mono text-sm break-words max-h-40 overflow-y-auto font-bold text-gray-800">{confirmationData.code}</div>
                        <div className="flex justify-center gap-4 mt-4">
                            <button onClick={() => handleConfirmation(true)} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md">Sí, Agregar</button>
                            <button onClick={() => handleConfirmation(false)} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md">No, Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
            <header className="text-center">
                <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnQ4MGZzdXYzYWo1cXRiM3I1cjNoNjd4cjdia202ZXcwNjJ6YjdvbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QQO6BH98nhigF8FLsb/giphy.gif" alt="Scanner Logo" className="mx-auto h-24 w-auto mb-4" />
                <h1 className="text-2xl md:text-3xl font-bold text-green-700">Escáner de Códigos</h1>
                <p className="text-gray-600 mt-1">Escanea con cámara o escáner físico, exporta a CSV y luego ingresa los datos.</p>
            </header>

            <div className="space-y-2">
                <label htmlFor="encargado" className="block text-sm font-bold text-gray-800 mb-2">Nombre del Encargado:</label>
                <input type="text" id="encargado" name="encargado" className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="Ej: Juan Pérez" value={encargado} onChange={(e) => setEncargado(e.target.value)} />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-800 mb-2">Método de Escaneo:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => setSelectedScannerMode('camara')} className={`w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none ${selectedScannerMode === 'camara' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}>CÁMARA</button>
                    <button onClick={() => setSelectedScannerMode('fisico')} className={`w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none ${selectedScannerMode === 'fisico' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}>ESCÁNER FÍSICO</button>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-800 mb-2">Área que Registra:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => setSelectedArea('REVISIÓN CALIDAD')} className={`w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none ${selectedArea === 'REVISIÓN CALIDAD' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}>REVISIÓN CALIDAD</button>
                    <button onClick={() => setSelectedArea('ENTREGA A COLECTA')} className={`w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none ${selectedArea === 'ENTREGA A COLECTA' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}>ENTREGA A COLECTA</button>
                </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
                <div className="scanner-container">
                    <div id="reader" ref={readerRef} className={selectedScannerMode === 'camara' ? 'block' : 'hidden'}></div>
                    {selectedScannerMode === 'fisico' &&
                        <div id="physical-scanner-status" className="mt-4 text-center p-2 rounded-md bg-green-100 text-green-800">
                            Escáner físico listo. Conecta tu dispositivo y comienza a escanear.
                            <input type="text" ref={physicalScannerInputRef} className="opacity-0 absolute" onKeyDown={handlePhysicalScannerKeyDown}/>
                        </div>
                    }
                </div>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    <button onClick={handleStartScan} disabled={scannerActive} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50">Iniciar Escaneo</button>
                    <button onClick={handleStopScan} disabled={!scannerActive} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50">Detener Escaneo</button>
                    {scannerActive && selectedScannerMode === 'camara' && cameras.length > 1 &&
                        <button onClick={changeCamera} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-md">Cambiar Cámara 📸</button>
                    }
                </div>
                {scannerActive && selectedScannerMode === 'camara' && (
                <div id="camera-adv-controls" className="mt-4 p-4 bg-gray-200 rounded-lg space-y-4">
                    <div id="flash-control" className="text-center">
                        <button onClick={toggleFlash} className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-md">{isFlashOn ? 'Desactivar Flash 💡' : 'Activar Flash 🔦'}</button>
                    </div>
                    <div id="zoom-control" className="text-center">
                        <label htmlFor="zoom-slider" className="block mb-2 font-medium text-gray-800">Zoom 🔎</label>
                        <input type="range" id="zoom-slider" className="w-full" min="1" max="5" step="0.1" value={zoom} onChange={handleZoom} />
                    </div>
                </div>
                )}
            </div>

            <div id="result-container" className="space-y-4">
                <div className={`p-4 rounded-lg text-center font-semibold text-lg transition-all duration-300 ${message.type === 'success' ? 'bg-green-100 text-green-800' : message.type === 'duplicate' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{message.text}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <h3 className="font-bold text-gray-800 uppercase text-sm">Escaneo Total</h3>
                        <p className="text-3xl font-mono text-green-600">{totalScans}</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <h3 className="font-bold text-gray-800 uppercase text-sm">FedEx, P. Express, Otros</h3>
                        <p className="text-3xl font-mono text-yellow-500">{otherScans}</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <h3 className="font-bold text-gray-800 uppercase text-sm">Códigos MEL</h3>
                        <p className="text-3xl font-mono text-green-600">{uniqueScans}</p>
                    </div>
                </div>
            </div>

            <div>
                <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                    <label htmlFor="manual-code-input" className="block text-sm font-bold text-gray-800 mb-2">Ingreso Manual:</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input type="text" id="manual-code-input" value={manualCode} onChange={e => setManualCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()} className="w-full px-4 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" placeholder="Escriba el código aquí..." />
                        <button onClick={handleManualAdd} className="inline-flex items-center px-4 py-2 border border-l-0 border-green-600 rounded-r-md bg-green-600 text-white hover:bg-green-700 font-semibold">
                            Agregar +
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-800">Registros Únicos</h2>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={handleExportCsv} disabled={scannedData.length === 0} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm text-sm transition-colors duration-200 disabled:opacity-50">1. Exportar CSV</button>
                        <button onClick={handleIngresarDatos} disabled={scannedData.length === 0} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm text-sm transition-colors duration-200 disabled:opacity-50">2. Ingresar Datos</button>
                        <button onClick={clearSessionData} className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-sm text-sm transition-colors duration-200">Limpiar</button>
                    </div>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CODIGO MEL</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FECHA</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HORA</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ENCARGADO</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AREA</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {scannedData.map((data, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono">{data.code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.fecha}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.hora}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{data.encargado}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{data.area}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Scanner;
