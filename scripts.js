async function checkKeybox() {
    const fileInput = document.getElementById("fileInput");
    const resultDiv = document.getElementById("result");

    if (!fileInput.files.length) {
        resultDiv.textContent = "Please select a file.";
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(event) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(event.target.result, "application/xml");
        const certificates = Array.from(xmlDoc.getElementsByTagName("Certificate"));

        if (certificates.length < 4) {
            resultDiv.textContent = "Invalid file: not enough certificates. File will be deleted.";
            return;
        }

        try {
            const ecCert = certificates[0].textContent.trim();
            const rsaCert = certificates[3].textContent.trim();
            
            const ecCertSN = parseCertificateSerialNumber(ecCert);
            const rsaCertSN = parseCertificateSerialNumber(rsaCert);

            if (!ecCertSN || !rsaCertSN) {
                resultDiv.textContent = "Error: Unable to parse certificate serial numbers.";
                return;
            }

            const isRevoked = await checkRevocationList(ecCertSN, rsaCertSN);

            resultDiv.innerHTML = `
                <strong>EC Cert Serial Number:</strong> ${ecCertSN} <br>
                <strong>RSA Cert Serial Number:</strong> ${rsaCertSN} <br>
                ${isRevoked ? "<span style='color: red;'>Certificate is revoked!</span>" : "<span style='color: green;'>Certificate is valid.</span>"}
            `;
        } catch (error) {
            console.error("Error processing certificates:", error);
            resultDiv.textContent = "Error processing certificates.";
        }
    };

    reader.readAsText(file);
}

// 解析证书序列号的辅助函数
function parseCertificateSerialNumber(cert) {
    try {
        const lines = cert.split("\n").map(line => line.trim()).join("\n");
        const certObj = forge.pki.certificateFromPem(lines);
        return certObj.serialNumber;
    } catch (e) {
        console.error("Failed to parse certificate:", e);
        return null;
    }
}

// 检查吊销列表的辅助函数
async function checkRevocationList(ecCertSN, rsaCertSN) {
    try {
        const response = await fetch("https://android.googleapis.com/attestation/status", {
            headers: { "Cache-Control": "max-age=0" }
        });
        const revocationList = await response.json();
        
        return revocationList.entries[ecCertSN] || revocationList.entries[rsaCertSN];
    } catch (error) {
        console.error("Failed to fetch revocation list:", error);
        return false;
    }
}
