// QR碼掃描功能
const qrResult = document.getElementById('qr-result');
const scanButton = document.getElementById('scan-button');
const qrReader = document.getElementById('qr-reader');
let html5QrCode;

// 初始化QR碼掃描
function initQrScanner() {
    html5QrCode = new Html5Qrcode("qr-reader");
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    // 成功回調
    const qrCodeSuccessCallback = (decodedText) => {
        qrResult.value = decodedText;
        stopScanner();
        
        // 如果在病床選擇頁面，則顯示病床資訊和主題選擇
        if (window.location.pathname.includes('bed-selection.html')) {
            const bedNumber = document.getElementById('bed-number');
            if (bedNumber) {
                bedNumber.textContent = decodedText;
                document.getElementById('patient-info').style.display = 'block';
                loadBedTopics(decodedText);
            }
        }
    };

    // 啟動QR碼掃描
    scanButton.addEventListener('click', () => {
        qrReader.style.display = 'block';
        
        // 檢查相機權限
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length) {
                html5QrCode.start(
                    { facingMode: "environment" }, 
                    config,
                    qrCodeSuccessCallback
                ).catch(err => {
                    console.error("掃描器啟動失敗:", err);
                    alert("無法啟動相機掃描器，請確認權限已啟用。");
                });
            } else {
                alert("未偵測到相機裝置");
            }
        }).catch(err => {
            console.error("相機偵測錯誤:", err);
            alert("無法取得相機權限，請確認權限已啟用。");
        });
    });
}

// 停止掃描
function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            qrReader.style.display = 'none';
        }).catch(err => {
            console.error("掃描器停止失敗:", err);
        });
    }
}

// 當DOM載入完成時初始化
document.addEventListener('DOMContentLoaded', initQrScanner);

// 病床選擇頁面特有的掃描功能
if (window.location.pathname.includes('bed-selection.html')) {
    const patientScanButton = document.getElementById('patient-scan-button');
    const patientQrReader = document.getElementById('patient-qr-reader');
    let patientQrScanner;
    
    // 初始化病人QR碼掃描器
    if (patientScanButton && patientQrReader) {
        patientScanButton.addEventListener('click', () => {
            patientQrReader.style.display = 'block';
            
            // 檢查相機權限
            Html5Qrcode.getCameras().then(devices => {
                if (devices && devices.length) {
                    patientQrScanner = new Html5Qrcode("patient-qr-reader");
                    
                    patientQrScanner.start(
                        { facingMode: "environment" }, 
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        (decodedText) => {
                            document.getElementById('qr-result').value = decodedText;
                            
                            // 停止掃描
                            if (patientQrScanner && patientQrScanner.isScanning) {
                                patientQrScanner.stop().then(() => {
                                    patientQrReader.style.display = 'none';
                                });
                            }
                        }
                    ).catch(err => {
                        console.error("病人掃描器啟動失敗:", err);
                        alert("無法啟動相機掃描器，請確認權限已啟用。");
                    });
                } else {
                    alert("未偵測到相機裝置");
                }
            }).catch(err => {
                console.error("相機偵測錯誤:", err);
                alert("無法取得相機權限，請確認權限已啟用。");
            });
        });
    }
}
