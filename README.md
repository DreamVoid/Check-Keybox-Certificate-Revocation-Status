# Keybox Checker

此脚本用于批量检查指定目录下的 Keybox 文件是否被吊销，并自动重命名解析失败或证书不完整的文件。

## 功能描述

- **吊销检查**：通过获取在线吊销列表，检查每个文件的证书序列号是否被吊销。
- **证书解析**：提取并检查文件中的 `Certificate` 标签，解析 EC 和 RSA 证书的序列号。
- **文件重命名**：
  - 解析失败的 XML 文件会被自动重命名（添加 .revoked 后缀）。
  - 证书数量不足（少于 4 个 `Certificate` 标签）的文件会被自动重命名。
  - 吊销列表中包含的证书文件会被自动重命名。

## 使用说明

Windows 运行 `run.bat [目录路径]`，Linux 运行 `run.sh [目录路径]`。

目录路径参数可空，默认检查当前目录的 `keybox` 文件夹。

## 脚本逻辑

1. 解析每个 XML 文件，提取所有 `Certificate` 标签内容。
2. 解析证书，获取 EC 和 RSA 证书的序列号。
3. 检查证书序列号是否在吊销列表中。
4. 若证书数量不足、解析失败或被吊销，自动重命名对应文件。

## 示例输出

```
正在检查 C:\Users\Administrator\keybox_files\keybox_1.xml...
EC Cert SN: a1b2c3d4e5f67890
RSA Cert SN: 12345abcde67890f

文件 C:\Users\Administrator\keybox_files\keybox_1.xml 仍然有效！

Error: C:\Users\Administrator\keybox_files\keybox_2.xml 证书数量不足，跳过...
Error: C:\Users\Administrator\keybox_files\keybox_3.xml 不是合法的XML文件，跳过...
文件 C:\Users\Administrator\keybox_files\keybox_4.xml 已被吊销！重命名文件...
```

## 注意事项

- 建议目录中仅包含 `.xml` 文件，避免不必要的错误。
- 如有需要可自行修改吊销列表的 URL。

## 依赖库

- `requests`：用于下载吊销列表。
- `cryptography`：用于解析证书序列号。
- `xml.etree.ElementTree`：用于解析 XML 文件内容。

## License

MIT License
