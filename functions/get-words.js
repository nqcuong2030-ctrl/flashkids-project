// functions/get-words.js
const fs = require('fs').promises;
const path = require('path');

exports.handler = async () => {
    // Luôn đọc file tổng hợp chứa tất cả dữ liệu
    const filePath = path.resolve(__dirname, '..', 'data', 'flashcards-all.json');

    try {
        const data = await fs.readFile(filePath, 'utf8');
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: data,
        };
    } catch (error) {
        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Không tìm thấy file dữ liệu tổng hợp (flashcards-all.json).' }),
        };
    }
};