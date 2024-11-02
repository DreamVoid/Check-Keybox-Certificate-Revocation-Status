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

        // 提取所有 <Certificate> 标签
        const certificates = Array.from(xmlDoc.getElementsByTagName("Certificate"));
        if (certificates.length < 4) {
            resultDiv.textContent = "Invalid file: not enough certificates. File would be deleted.";
            return;
        }

        try {
            const ecCert = certificates[0].textContent.trim();
            const rsaCert = certificates[3].textContent.trim();

            const ecCertSN = await parseCertificateSerialNumber(ecCert);
            const rsaCertSN = await parseCertificateSerialNumber(rsaCert);

            if (!ecCertSN || !rsaCertSN) {
                resultDiv.textContent = "Error: Unable to parse certificate serial numbers.";
                return;
            }

            // 获取吊销列表
            const isRevoked = await checkRevocationList(ecCertSN, rsaCertSN);

            resultDiv.innerHTML = `
                <strong>EC Cert Serial Number:</strong> ${ecCertSN} <br>
                <strong>RSA Cert Serial Number:</strong> ${rsaCertSN} <br>
                ${isRevoked ? "<span style='color: red;'>Certificate is revoked!</span>" : "<span style='color: green;'>Certificate is valid.</span>"}
            `;
        } catch (error) {
            console.error("Error parsing certificates:", error);
            resultDiv.textContent = "Error: Unable to parse certificate serial numbers.";
        }
    };

    reader.readAsText(file);
}

// 解析证书序列号的辅助函数
async function parseCertificateSerialNumber(cert) {
    try {
        const lines = cert.split("\n").map(line => line.trim()).join("\n");
        let certObj;

        // 尝试解析为 EC 证书
        try {
            certObj = forge.pki.certificateFromPem(lines);
        } catch (e) {
            console.error("Failed to parse as EC certificate:", e);
            // 如果 EC 解析失败，尝试解析为其他类型的证书
            try {
                certObj = forge.pki.certificateFromPem(lines);
            } catch (err) {
                console.error("Failed to parse certificate:", err);
                return null;
            }
        }

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
