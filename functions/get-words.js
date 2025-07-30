// functions/get-words.js
const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
    // Lấy level từ query parameter, ví dụ: ?level=a1
    const { level } = event.queryStringParameters;

    if (!level) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Thiếu tham số level.' }),
        };
    }

    // Tạo đường dẫn an toàn đến file JSON
    const filePath = path.resolve(__dirname, '..', 'data', `flashcards-${level}.json`);

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
            body: JSON.stringify({ error: `Không tìm thấy dữ liệu cho level ${level}.` }),
        };
    }
};