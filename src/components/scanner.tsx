
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
        <div>
            {showConfirmation && (
                <div id="qr-confirmation-overlay">
                    <div>
                        <h3>{confirmationData.title}</h3>
                        <p>{confirmationData.message}</p>
                        <div>{confirmationData.code}</div>
                        <div>
                            <button onClick={() => handleConfirmation(true)}>Sí, Agregar</button>
                            <button onClick={() => handleConfirmation(false)}>No, Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
            <header>
                <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnQ4MGZzdXYzYWo1cXRiM3I1cjNoNjd4cjdia202ZXcwNjJ6YjdvbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QQO6BH98nhigF8FLsb/giphy.gif" alt="Scanner Logo" />
                <h1>Escáner de Códigos</h1>
                <p>Escanea con cámara o escáner físico, exporta a CSV y luego ingresa los datos.</p>
            </header>

            <div>
                <label htmlFor="encargado">Nombre del Encargado:</label>
                <input type="text" id="encargado" name="encargado" placeholder="Ej: Juan Pérez" value={encargado} onChange={(e) => setEncargado(e.target.value)} />
            </div>

            <div>
                <label>Método de Escaneo:</label>
                <div>
                    <button onClick={() => setSelectedScannerMode('camara')}>CÁMARA</button>
                    <button onClick={() => setSelectedScannerMode('fisico')}>ESCÁNER FÍSICO</button>
                </div>
            </div>

            <div>
                <label>Área que Registra:</label>
                <div>
                    <button onClick={() => setSelectedArea('REVISIÓN CALIDAD')}>REVISIÓN CALIDAD</button>
                    <button onClick={() => setSelectedArea('ENTREGA A COLECTA')}>ENTREGA A COLECTA</button>
                </div>
            </div>

            <div>
                <div className="scanner-container">
                    <div id="reader" ref={readerRef} style={{display: selectedScannerMode === 'camara' ? 'block' : 'none'}}></div>
                    {selectedScannerMode === 'fisico' &&
                        <div id="physical-scanner-status">
                            Escáner físico listo. Conecta tu dispositivo y comienza a escanear.
                            <input type="text" ref={physicalScannerInputRef} onKeyDown={handlePhysicalScannerKeyDown}/>
                        </div>
                    }
                </div>
                <div>
                    <button onClick={handleStartScan} disabled={scannerActive}>Iniciar Escaneo</button>
                    <button onClick={handleStopScan} disabled={!scannerActive}>Detener Escaneo</button>
                    {scannerActive && selectedScannerMode === 'camara' && cameras.length > 1 &&
                        <button onClick={changeCamera}>Cambiar Cámara 📸</button>
                    }
                </div>
                {scannerActive && selectedScannerMode === 'camara' && (
                <div id="camera-adv-controls">
                    <div id="flash-control">
                        <button onClick={toggleFlash}>{isFlashOn ? 'Desactivar Flash 💡' : 'Activar Flash 🔦'}</button>
                    </div>
                    <div id="zoom-control">
                        <label htmlFor="zoom-slider">Zoom 🔎</label>
                        <input type="range" id="zoom-slider" min="1" max="5" step="0.1" value={zoom} onChange={handleZoom} />
                    </div>
                </div>
                )}
            </div>

            <div id="result-container">
                <div>{message.text}</div>
                <div>
                    <div>
                        <h3>Escaneo Total</h3>
                        <p>{totalScans}</p>
                    </div>
                    <div>
                        <h3>FedEx, P. Express, Otros</h3>
                        <p>{otherScans}</p>
                    </div>
                    <div>
                        <h3>Códigos MEL</h3>
                        <p>{uniqueScans}</p>
                    </div>
                </div>
            </div>

            <div>
                <div>
                    <label htmlFor="manual-code-input">Ingreso Manual:</label>
                    <div>
                        <input type="text" id="manual-code-input" value={manualCode} onChange={e => setManualCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()} placeholder="Escriba el código aquí..." />
                        <button onClick={handleManualAdd}>
                            Agregar +
                        </button>
                    </div>
                </div>

                <div>
                    <h2>Registros Únicos</h2>
                    <div>
                        <button onClick={handleExportCsv} disabled={scannedData.length === 0}>1. Exportar CSV</button>
                        <button onClick={handleIngresarDatos} disabled={scannedData.length === 0}>2. Ingresar Datos</button>
                        <button onClick={clearSessionData}>Limpiar</button>
                    </div>
                </div>

                <div>
                    <table>
                        <thead>
                            <tr>
                                <th>CODIGO MEL</th>
                                <th>FECHA</th>
                                <th>HORA</th>
                                <th>ENCARGADO</th>
                                <th>AREA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scannedData.map((data, index) => (
                                <tr key={index}>
                                    <td>{data.code}</td>
                                    <td>{data.fecha}</td>
                                    <td>{data.hora}</td>
                                    <td>{data.encargado}</td>
                                    <td>{data.area}</td>
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
