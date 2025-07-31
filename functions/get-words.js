// functions/get-words.js
const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
    const { level } = event.queryStringParameters;

    if (!level) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Thiếu tham số level.' }) };
    }

    const filePath = path.resolve(__dirname, '..', 'data', 'flashcards-all.json');

    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const allData = JSON.parse(fileContent);

        // --- SỬA LỖI Ở ĐÂY ---
        // Thêm .toLowerCase() để so sánh không phân biệt chữ hoa/thường
        const levelCategories = allData.categories.filter(cat => cat.level && cat.level.toLowerCase() === level.toLowerCase());
        const levelFlashcards = allData.flashcards.filter(card => card.level && card.level.toLowerCase() === level.toLowerCase());

        const responseData = {
            categories: levelCategories,
            flashcards: levelFlashcards
        };

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(responseData),
        };
    } catch (error) {
        console.error('ERROR reading or processing file:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Lỗi xử lý file dữ liệu.' }),
        };
    }
};