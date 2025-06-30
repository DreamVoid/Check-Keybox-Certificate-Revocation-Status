import os
import time
import xml.etree.ElementTree as ET
import requests
from cryptography import x509

# 获取吊销列表
API_URL = f'https://android.googleapis.com/attestation/status?{time.time_ns()}'
CRL = requests.get(API_URL, headers={'Cache-Control': 'max-age=0'}).json()


def parse_cert(cert: str) -> str:
    """解析PEM证书，返回序列号（十六进制字符串）"""
    cert = "\n".join(line.strip() for line in cert.strip().split("\n"))
    parsed = x509.load_pem_x509_certificate(cert.encode())
    return f'{parsed.serial_number:x}'


def checker(directory: str) -> None:
    for root, _, files in os.walk(directory):
        for file in files:
            if file.lower().endswith('.xml'):
                xml_file = os.path.join(root, file)
                try:
                    # 解析XML文件，提取所有Certificate标签内容
                    certs = [elem.text for elem in ET.parse(xml_file).getroot().iter() if elem.tag == 'Certificate']
                    if len(certs) < 4:
                        print(f'Error: {xml_file} 证书数量不足，跳过...')
                        return
                    print(f'正在检查 {xml_file}...')

                    ec_cert_sn = parse_cert(certs[0])
                    print(f'EC Cert SN: {ec_cert_sn}')
                    
                    rsa_cert_sn = parse_cert(certs[3])
                    print(f'RSA Cert SN: {rsa_cert_sn}')

                    # 检查证书是否被吊销
                    if any(sn in CRL["entries"] for sn in (ec_cert_sn, rsa_cert_sn)):
                        print(f'文件 {xml_file} 已被吊销！重命名文件...', end='\n\n')
                        revoked_file = f"{xml_file}.revoked"
                        os.rename(xml_file, revoked_file)
                    else:
                        print(f'文件 {xml_file} 仍然有效！', end='\n\n')

                except ET.ParseError:
                    print(f'Error: {xml_file} 不是合法的XML文件，跳过...', end='\n\n')
                except Exception as e:
                    print(f'Error: 检查 {xml_file} 时发生异常: {e}', end='\n\n')



def get_default_dir() -> str:
    """获取默认keybox目录"""
    return os.path.join(os.getcwd(), 'keybox')


if __name__ == '__main__':
    import sys
    if len(sys.argv) == 2:
        checker(sys.argv[1])
    else:
        default_dir = get_default_dir()
        print(f"正在检查默认的目录: {default_dir}", end='\n\n')
        checker(default_dir)
