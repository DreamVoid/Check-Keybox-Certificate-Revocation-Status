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

        // 尝试解析证书
        try {
            const ecCert = certificates[0].textContent.trim();
            const rsaCert = certificates[3].textContent.trim();

            const ecCertSN = parseCertificateSerialNumber(ecCert);
            const rsaCertSN = parseCertificateSerialNumber(rsaCert);

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
